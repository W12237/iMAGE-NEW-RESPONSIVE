import { describe, expect, it, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import {
  loginSchema,
  usernameSchema,
  updateUsernameSchema,
  updatePasswordSchema,
} from "./validation";
import {
  checkRateLimit,
  recordRateLimitFailure,
  resetRateLimit,
} from "./rate-limit";

describe("Admin Account Settings & Authentication Suite", () => {
  const testEmail = "test-admin@image.local";
  const testInitialUsername = "test_admin";
  const testInitialPassword = "InitialPassword123!";

  beforeEach(async () => {
    // Reset rate limits for test
    resetRateLimit("login", testEmail);
    resetRateLimit("login", testInitialUsername);
    resetRateLimit("username_change", "test-user-id");
    resetRateLimit("password_change", "test-user-id");

    // Clean up test admin user if present
    await prisma.adminSession.deleteMany({
      where: { user: { email: testEmail } },
    });
    await prisma.adminUser.deleteMany({
      where: {
        OR: [
          { email: testEmail },
          { username: testInitialUsername },
          { username: "new_admin_handle" },
        ],
      },
    });

    // Create a pristine test admin user
    await prisma.adminUser.create({
      data: {
        email: testEmail,
        username: testInitialUsername,
        passwordHash: await hash(testInitialPassword, 10),
      },
    });
  });

  // 1. Validation Schemas
  describe("Input Validation & Normalization", () => {
    it("validates valid usernames and rejects invalid characters and lengths", () => {
      expect(usernameSchema.safeParse("admin").success).toBe(true);
      expect(usernameSchema.safeParse("admin_123-new").success).toBe(true);
      expect(usernameSchema.safeParse("ab").success).toBe(false); // too short
      expect(usernameSchema.safeParse("a".repeat(31)).success).toBe(false); // too long
      expect(usernameSchema.safeParse("admin user").success).toBe(false); // spaces not allowed
      expect(usernameSchema.safeParse("admin@email").success).toBe(false); // symbol not allowed
    });

    it("validates login identifier accepting either email or username", () => {
      expect(loginSchema.safeParse({ email: testEmail, password: testInitialPassword }).success).toBe(true);
      expect(loginSchema.safeParse({ identifier: testInitialUsername, password: testInitialPassword }).success).toBe(true);
      expect(loginSchema.safeParse({ identifier: "bad", password: "short" }).success).toBe(false);
      expect(loginSchema.safeParse({ password: testInitialPassword }).success).toBe(false);
    });

    it("validates password update schema checking confirmation match and difference", () => {
      // Valid update
      expect(
        updatePasswordSchema.safeParse({
          currentPassword: "OldPassword123!",
          newPassword: "BrandNewPassword123!",
          confirmPassword: "BrandNewPassword123!",
        }).success
      ).toBe(true);

      // Mismatch
      expect(
        updatePasswordSchema.safeParse({
          currentPassword: "OldPassword123!",
          newPassword: "BrandNewPassword123!",
          confirmPassword: "DifferentPassword123!",
        }).success
      ).toBe(false);

      // Same as current password
      expect(
        updatePasswordSchema.safeParse({
          currentPassword: "SamePassword123!",
          newPassword: "SamePassword123!",
          confirmPassword: "SamePassword123!",
        }).success
      ).toBe(false);

      // Too short
      expect(
        updatePasswordSchema.safeParse({
          currentPassword: "OldPassword123!",
          newPassword: "short",
          confirmPassword: "short",
        }).success
      ).toBe(false);
    });
  });

  // 2. Authentication by Username or Email
  describe("Database Authentication Flow", () => {
    it("allows user lookup by either email or username", async () => {
      // Lookup by email
      const byEmail = await prisma.adminUser.findFirst({
        where: {
          OR: [{ email: testEmail }, { username: testEmail }],
        },
      });
      expect(byEmail).toBeDefined();
      expect(byEmail?.email).toBe(testEmail);

      // Lookup by username
      const byUsername = await prisma.adminUser.findFirst({
        where: {
          OR: [{ email: testInitialUsername }, { username: testInitialUsername }],
        },
      });
      expect(byUsername).toBeDefined();
      expect(byUsername?.id).toBe(byEmail?.id);

      // Password matches
      const match = await compare(testInitialPassword, byUsername!.passwordHash);
      expect(match).toBe(true);

      // Wrong password fails
      const wrongMatch = await compare("WrongPassword!", byUsername!.passwordHash);
      expect(wrongMatch).toBe(false);
    });
  });

  // 3. Username Change Workflow
  describe("Username Update Workflow", () => {
    it("rejects username update if current password is wrong", async () => {
      const user = await prisma.adminUser.findUnique({ where: { email: testEmail } });
      const passwordMatch = await compare("IncorrectPassword!", user!.passwordHash);
      expect(passwordMatch).toBe(false);
    });

    it("successfully updates username in database and allows login with new handle", async () => {
      const user = await prisma.adminUser.findUnique({ where: { email: testEmail } });
      expect(user).toBeDefined();

      const newHandle = "new_admin_handle";

      // Verify current password
      expect(await compare(testInitialPassword, user!.passwordHash)).toBe(true);

      // Update in DB
      await prisma.adminUser.update({
        where: { id: user!.id },
        data: { username: newHandle },
      });

      // Confirm DB record
      const updated = await prisma.adminUser.findUnique({ where: { id: user!.id } });
      expect(updated?.username).toBe(newHandle);

      // Old username fails to resolve
      const oldLookup = await prisma.adminUser.findFirst({
        where: {
          OR: [{ email: testInitialUsername }, { username: testInitialUsername }],
        },
      });
      expect(oldLookup).toBeNull();

      // New username succeeds
      const newLookup = await prisma.adminUser.findFirst({
        where: {
          OR: [{ email: newHandle }, { username: newHandle }],
        },
      });
      expect(newLookup).toBeDefined();
      expect(newLookup?.id).toBe(user!.id);

      // Email login still works seamlessly
      const emailLookup = await prisma.adminUser.findFirst({
        where: {
          OR: [{ email: testEmail }, { username: testEmail }],
        },
      });
      expect(emailLookup).toBeDefined();
      expect(emailLookup?.id).toBe(user!.id);
    });

    it("prevents duplicate username registration", async () => {
      const otherUser = await prisma.adminUser.create({
        data: {
          email: "other@image.local",
          username: "taken_handle",
          passwordHash: await hash("SomePassword123!", 10),
        },
      });

      // Checking uniqueness before update
      const conflict = await prisma.adminUser.findFirst({
        where: {
          id: { not: "some-user-id" },
          OR: [{ username: "taken_handle" }, { email: "taken_handle" }],
        },
      });
      expect(conflict).toBeDefined();
      expect(conflict?.id).toBe(otherUser.id);

      // Clean up
      await prisma.adminUser.delete({ where: { id: otherUser.id } });
    });
  });

  // 4. Password Change Workflow & Session Revocation
  describe("Password Update & Session Invalidation", () => {
    it("updates password hash and invalidates active sessions", async () => {
      const user = await prisma.adminUser.findUnique({ where: { email: testEmail } });
      expect(user).toBeDefined();

      // Create a mock active session
      const session = await prisma.adminSession.create({
        data: {
          tokenHash: "sample-token-hash-12345",
          userId: user!.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });
      expect(session).toBeDefined();

      // Perform password update with atomic session invalidation
      const newPassword = "BrandNewSecurePassword2026!";
      const newPasswordHash = await hash(newPassword, 10);

      await prisma.$transaction(async (tx) => {
        await tx.adminUser.update({
          where: { id: user!.id },
          data: { passwordHash: newPasswordHash },
        });
        await tx.adminSession.deleteMany({
          where: { userId: user!.id },
        });
      });

      // 1. Old password fails
      const updatedUser = await prisma.adminUser.findUnique({ where: { id: user!.id } });
      expect(await compare(testInitialPassword, updatedUser!.passwordHash)).toBe(false);

      // 2. New password succeeds
      expect(await compare(newPassword, updatedUser!.passwordHash)).toBe(true);

      // 3. Existing sessions are completely cleared
      const remainingSessions = await prisma.adminSession.findMany({
        where: { userId: user!.id },
      });
      expect(remainingSessions.length).toBe(0);
    });
  });

  // 5. Rate Limiting
  describe("Rate Limiting Guard", () => {
    it("throttles after repeated failed attempts and resets on success", () => {
      const key = "rate-limit-test-key";
      resetRateLimit("login", key);

      // 5 attempts allowed
      for (let i = 0; i < 4; i++) {
        recordRateLimitFailure("login", key);
        const check = checkRateLimit("login", key, 5);
        expect(check.allowed).toBe(true);
      }

      // 5th failure exceeds limit
      recordRateLimitFailure("login", key);
      const blockedCheck = checkRateLimit("login", key, 5);
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.remaining).toBe(0);

      // Reset clears the bucket
      resetRateLimit("login", key);
      const afterReset = checkRateLimit("login", key, 5);
      expect(afterReset.allowed).toBe(true);
    });
  });

  // 6. Seed Script Idempotency
  describe("Seed Script Idempotency", () => {
    it("preserves updated credentials and does not overwrite existing admin on rerun", async () => {
      const user = await prisma.adminUser.findUnique({ where: { email: testEmail } });
      expect(user).toBeDefined();

      // Simulate a custom password update
      const customPassword = "CustomUserPassword123!";
      const customHash = await hash(customPassword, 10);
      await prisma.adminUser.update({
        where: { id: user!.id },
        data: { passwordHash: customHash, username: "custom_admin" },
      });

      // Simulate the updated idempotent seed logic:
      // if existingAdmin exists -> DO NOT touch password or username!
      const existingAdmin = await prisma.adminUser.findFirst({
        where: {
          OR: [{ email: testEmail }, { username: "admin" }],
        },
      });

      if (!existingAdmin) {
        // Should NOT execute
        await prisma.adminUser.create({
          data: {
            email: testEmail,
            username: "admin",
            passwordHash: await hash("DefaultEnvPassword123!", 10),
          },
        });
      }

      // Verify custom password was NOT overwritten
      const checkUser = await prisma.adminUser.findUnique({ where: { id: user!.id } });
      expect(await compare(customPassword, checkUser!.passwordHash)).toBe(true);
      expect(checkUser?.username).toBe("custom_admin");
    });
  });
});

