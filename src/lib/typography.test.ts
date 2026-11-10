import { describe, expect, it } from "vitest";
import {
  TYPOGRAPHY_ROLES,
  APPROVED_FONT_WEIGHTS,
  BASELINE_TYPOGRAPHY,
  validateTypographyValue,
  computeFluidClamp,
  resolveTypography,
  getFluidTypographyStyle,
} from "./typography";

describe("Typography System - Safe Range Validation", () => {
  it("approves valid values within role-specific bounds", () => {
    // sectionHeading safeMinMobile: 20, safeMaxMobile: 44, safeMinDesktop: 26, safeMaxDesktop: 64
    const err = validateTypographyValue("sectionHeading", {
      fontSizeMobile: 24,
      fontSizeDesktop: 40,
      lineHeight: 1.25,
      fontWeight: 500,
    });
    expect(err).toBeNull();
  });

  it("rejects mobile font size that is too small or too large", () => {
    const tooSmall = validateTypographyValue("heroHeading", {
      fontSizeMobile: 12, // safeMinMobile is 24
    });
    expect(tooSmall).toContain("Mobile font size");

    const tooLarge = validateTypographyValue("heroHeading", {
      fontSizeMobile: 100, // safeMaxMobile is 64
    });
    expect(tooLarge).toContain("Mobile font size");
  });

  it("rejects desktop font size out of bounds", () => {
    const err = validateTypographyValue("cardTitle", {
      fontSizeDesktop: 80, // safeMaxDesktop is 36
    });
    expect(err).toContain("Desktop font size");
  });

  it("rejects invalid line height", () => {
    const tooTight = validateTypographyValue("body", {
      lineHeight: 0.8, // minLineHeight is 1.3
    });
    expect(tooTight).toContain("Line height");

    const tooLoose = validateTypographyValue("body", {
      lineHeight: 3.5, // maxLineHeight is 2.1
    });
    expect(tooLoose).toContain("Line height");
  });

  it("restricts font weights to approved brand weights (300, 400, 500, 600, 700)", () => {
    expect(validateTypographyValue("tag", { fontWeight: 300 })).toBeNull();
    expect(validateTypographyValue("tag", { fontWeight: 600 })).toBeNull();

    const invalidWeight = validateTypographyValue("tag", { fontWeight: 900 });
    expect(invalidWeight).toContain("Font weight must be one of approved weights");
  });
});

describe("Typography System - Fluid Clamp Math", () => {
  it("returns fixed pixel value when mobile equals desktop", () => {
    expect(computeFluidClamp(16, 16)).toBe("16px");
  });

  it("computes bounded clamp with correct rem and vw slope between 390px and 1280px", () => {
    const clamp = computeFluidClamp(24, 40);
    expect(clamp).toMatch(/^clamp\(24px, .+rem \+ .+vw, 40px\)$/);
  });

  it("handles reversed mobile > desktop safely by bounding between min and max", () => {
    const clamp = computeFluidClamp(40, 24);
    expect(clamp).toContain("clamp(24px,");
    expect(clamp).toContain("40px)");
  });
});

describe("Typography System - 4-Tier Inheritance Resolution", () => {
  it("returns baseline design system defaults when no database records exist", () => {
    const emptyMap = new Map();
    const resolved = resolveTypography("heroHeading", "global", "en", emptyMap);

    expect(resolved.role).toBe("heroHeading");
    expect(resolved.fontSizeMobile).toBe(BASELINE_TYPOGRAPHY.heroHeading.en.fontSizeMobile);
    expect(resolved.fontSizeDesktop).toBe(BASELINE_TYPOGRAPHY.heroHeading.en.fontSizeDesktop);
    expect(resolved.fontWeight).toBe(BASELINE_TYPOGRAPHY.heroHeading.en.fontWeight);
    expect(resolved.isOverridden).toBe(false);
    expect(resolved.inheritedFrom).toBe("Design System Default");
  });

  it("inherits global generic override across all sections", () => {
    const records = new Map([
      ["global:sectionHeading:all", { fontSizeDesktop: 48, fontWeight: 600 }],
    ]);

    const resolved = resolveTypography("sectionHeading", "home_projects", "en", records);
    expect(resolved.fontSizeDesktop).toBe(48);
    expect(resolved.fontWeight).toBe(600);
    // Unspecified mobile size falls back to baseline
    expect(resolved.fontSizeMobile).toBe(BASELINE_TYPOGRAPHY.sectionHeading.en.fontSizeMobile);
    expect(resolved.isOverridden).toBe(false);
    expect(resolved.inheritedFrom).toBe("Global");
  });

  it("section override takes precedence over global override", () => {
    const records = new Map([
      ["global:cardTitle:all", { fontSizeDesktop: 24 }],
      ["home_projects:cardTitle:all", { fontSizeDesktop: 30 }],
    ]);

    const resolved = resolveTypography("cardTitle", "home_projects", "en", records);
    expect(resolved.fontSizeDesktop).toBe(30);
    expect(resolved.isOverridden).toBe(true);
    expect(resolved.inheritedFrom).toBe("Section");
  });

  it("locale-specific section override takes top precedence", () => {
    const records = new Map([
      ["global:cardTitle:all", { fontSizeDesktop: 24 }],
      ["home_projects:cardTitle:all", { fontSizeDesktop: 28 }],
      ["home_projects:cardTitle:ar", { fontSizeDesktop: 32 }],
    ]);

    const resolvedAr = resolveTypography("cardTitle", "home_projects", "ar", records);
    expect(resolvedAr.fontSizeDesktop).toBe(32);
    expect(resolvedAr.isOverridden).toBe(true);
    expect(resolvedAr.inheritedFrom).toBe("Section (AR)");

    const resolvedEn = resolveTypography("cardTitle", "home_projects", "en", records);
    expect(resolvedEn.fontSizeDesktop).toBe(28);
  });

  it("generates valid CSS style object with fluid font size", () => {
    const resolved = resolveTypography("tag", "global", "en", new Map());
    const style = getFluidTypographyStyle(resolved, "en");

    expect(style.fontSize).toBeDefined();
    expect(style.lineHeight).toBe(resolved.lineHeight);
    expect(style.fontWeight).toBe(resolved.fontWeight);
  });
});

