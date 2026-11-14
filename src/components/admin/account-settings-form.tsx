"use client";

import React, { useActionState, useState } from "react";
import { updateAdminUsername, updateAdminPassword } from "@/app/admin/actions";
import type { ActionState } from "@/app/admin/actions";

interface AccountSettingsFormProps {
  currentEmail: string;
  currentUsername: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export function AccountSettingsForm({
  currentEmail,
  currentUsername,
  createdAt,
  updatedAt,
}: AccountSettingsFormProps) {
  // Password visibility states
  const [showUsernameConfirmPassword, setShowUsernameConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form actions
  const [usernameState, usernameAction, usernamePending] = useActionState<ActionState, FormData>(
    updateAdminUsername,
    {}
  );
  const [passwordState, passwordAction, passwordPending] = useActionState<ActionState, FormData>(
    updateAdminPassword,
    {}
  );

  const formattedCreated = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  const formattedUpdated = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="account-settings-container">
      {/* Account Overview Identity Banner */}
      <section className="panel" aria-label="Account Overview">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(242, 185, 133, 0.2)",
                border: "2px solid rgba(242, 185, 133, 0.4)",
                color: "var(--peach-dark, #b36f55)",
                display: "grid",
                placeItems: "center",
                fontSize: "22px",
                fontWeight: 600,
              }}
              aria-hidden="true"
            >
              {currentUsername
                ? currentUsername.charAt(0).toUpperCase()
                : currentEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "20px", color: "var(--forest, #152a20)" }}>
                  {currentUsername || currentEmail}
                </h2>
                <span className="status-badge status-published">Verified Administrator</span>
              </div>
              <p style={{ margin: "4px 0 0", color: "var(--muted, #5e6b63)", fontSize: "13px" }}>
                Active administrator account for Image Developments CMS.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--muted, #5e6b63)" }}>
            <div>
              <strong>Member since:</strong> {formattedCreated}
            </div>
            {formattedUpdated && (
              <div>
                <strong>Last credential change:</strong> {formattedUpdated}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "14px 18px",
            background: "#f7f9f6",
            border: "1px solid var(--line, #dfe4dc)",
            borderRadius: "10px",
            fontSize: "13px",
            color: "var(--ink, #162c20)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "#233d2c", flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <strong>Dual Login Supported:</strong> You can log in to Image Developments CMS using either your <strong>username</strong> or your <strong>email address</strong>.
            <div style={{ fontSize: "12px", color: "var(--muted, #5e6b63)", marginTop: "2px" }} dir="rtl">
              يدعم النظام تسجيل الدخول إما باستخدام اسم المستخدم أو عنوان البريد الإلكتروني.
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Grid for Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
        {/* Form A: Change Login Username */}
        <section className="panel" aria-label="Change Login Username">
          <div style={{ borderBottom: "1px solid var(--line-subtle, #edf1ea)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9a613d", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Identity & Sign In / الهوية وتسجيل الدخول</span>
            </div>
            <h2 style={{ margin: "6px 0 2px", fontSize: "18px" }}>Change Username / تعديل اسم المستخدم</h2>
            <p className="hint" style={{ margin: 0, fontSize: "12.5px" }}>
              Update the handle used to sign in to the CMS dashboard.
            </p>
          </div>

          <form action={usernameAction} aria-label="Username Update Form">
            {usernameState.error && (
              <div className="form-message error" role="alert" style={{ marginBottom: "18px" }}>
                {usernameState.error}
              </div>
            )}
            {usernameState.success && (
              <div className="form-message success" role="status" style={{ marginBottom: "18px" }}>
                {usernameState.success}
              </div>
            )}

            <label>
              <span>Current Username / اسم المستخدم الحالي</span>
              <input
                type="text"
                value={currentUsername || "(Not configured yet — email is used)"}
                readOnly
                disabled
                style={{
                  background: "#f7f9f6",
                  color: "#6b7770",
                  cursor: "not-allowed",
                  borderColor: "var(--line, #dfe4dc)",
                }}
              />
            </label>

            <label>
              <span>Login Email Address / البريد الإلكتروني (ثابت)</span>
              <input
                type="email"
                value={currentEmail}
                readOnly
                disabled
                style={{
                  background: "#f7f9f6",
                  color: "#6b7770",
                  cursor: "not-allowed",
                  borderColor: "var(--line, #dfe4dc)",
                }}
              />
            </label>

            <label>
              <span>New Username / اسم المستخدم الجديد *</span>
              <input
                name="newUsername"
                type="text"
                autoComplete="username"
                placeholder="e.g. image_admin or wessam"
                pattern="^[a-zA-Z0-9_-]{3,30}$"
                title="3 to 30 characters using letters, numbers, hyphens, and underscores."
                required
              />
              <span className="hint" style={{ fontSize: "11.5px", marginTop: "-3px" }}>
                3–30 characters (letters, numbers, hyphens, underscores). Unique across accounts.
              </span>
            </label>

            <label>
              <span>Current Password to Confirm / كلمة المرور الحالية للتأكيد *</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="currentPassword"
                  type={showUsernameConfirmPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowUsernameConfirmPassword(!showUsernameConfirmPassword)}
                  title={showUsernameConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showUsernameConfirmPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "var(--muted, #5e6b63)",
                  }}
                >
                  {showUsernameConfirmPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="primary"
                disabled={usernamePending}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {usernamePending ? (
                  <>
                    <span className="admin-spinner" aria-hidden="true" />
                    <span>Saving Username…</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Save Username / حفظ اسم المستخدم</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Form B: Change Password */}
        <section className="panel" aria-label="Change Account Password">
          <div style={{ borderBottom: "1px solid var(--line-subtle, #edf1ea)", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9a613d", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Security Credentials / كلمة المرور السرية</span>
            </div>
            <h2 style={{ margin: "6px 0 2px", fontSize: "18px" }}>Change Password / تغيير كلمة المرور</h2>
            <p className="hint" style={{ margin: 0, fontSize: "12.5px" }}>
              Set a new secure password. All other active sessions will be invalidated.
            </p>
          </div>

          <form action={passwordAction} aria-label="Password Update Form">
            {passwordState.error && (
              <div className="form-message error" role="alert" style={{ marginBottom: "18px" }}>
                {passwordState.error}
              </div>
            )}
            {passwordState.success && (
              <div className="form-message success" role="status" style={{ marginBottom: "18px" }}>
                {passwordState.success}
              </div>
            )}

            <label>
              <span>Current Password / كلمة المرور الحالية *</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                  aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "var(--muted, #5e6b63)",
                  }}
                >
                  {showCurrentPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <label>
              <span>New Password / كلمة المرور الجديدة *</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="At least 8 characters"
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? "Hide password" : "Show password"}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "var(--muted, #5e6b63)",
                  }}
                >
                  {showNewPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <span className="hint" style={{ fontSize: "11.5px", marginTop: "-3px" }}>
                Minimum 8 characters. Password managers and long passphrases are encouraged.
              </span>
            </label>

            <label>
              <span>Confirm New Password / تأكيد كلمة المرور الجديدة *</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Re-enter your new password"
                  required
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px",
                    color: "var(--muted, #5e6b63)",
                  }}
                >
                  {showConfirmPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="primary"
                disabled={passwordPending}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {passwordPending ? (
                  <>
                    <span className="admin-spinner" aria-hidden="true" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Update Password / تحديث كلمة المرور</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

