"use client";
import React, { useActionState, useEffect, useState, useRef } from "react";
import type { ActionState } from "@/app/admin/actions";

export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Save changes",
}: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // When form changes, mark dirty
  const handleFormChange = () => {
    if (!isDirty) setIsDirty(true);
  };

  // On successful persistence, clear dirty state and record timestamp
  useEffect(() => {
    if (state.success && !pending) {
      setIsDirty(false);
      setLastSavedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, [state.success, pending]);

  // Warn before navigating away if there are unsaved edits
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onChange={handleFormChange}
    >
      {!pending && state.error && (
        <div className="form-message error" role="alert" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}
      {!pending && state.success && (
        <div className="form-message success" role="status" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>
            {state.success} {lastSavedTime ? `(Persisted at ${lastSavedTime})` : ""}
          </span>
        </div>
      )}

      {children}

      {!pending && state.error && (
        <div className="form-message error" role="alert" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}
      {!pending && state.success && (
        <div className="form-message success" role="status" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>
            {state.success} {lastSavedTime ? `(Persisted at ${lastSavedTime})` : ""}
          </span>
        </div>
      )}

      <div className="admin-form-sticky-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
          {isDirty && !pending && (
            <span style={{ color: "#d97706", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 500 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#d97706" }} />
              Unsaved edits in form
            </span>
          )}
          {!isDirty && lastSavedTime && !pending && (
            <span style={{ color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
              All changes saved ({lastSavedTime})
            </span>
          )}
        </div>
        <button className="primary" disabled={pending} type="submit">
          {pending ? (
            <>
              <span className="admin-spinner" aria-hidden="true" />
              <span>Saving & Publishing…</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
export function LoginForm({action}:{action:(state:ActionState,data:FormData)=>Promise<ActionState>}){const[state,formAction,pending]=useActionState(action,{});return <form action={formAction} className="login-card"><div><span className="admin-kicker">Image Developments</span><h1>Admin sign in</h1><p>Manage website content securely.</p></div><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label>{state.error&&<p className="form-message error">{state.error}</p>}<button className="primary" disabled={pending}>{pending?"Signing in…":"Sign in"}</button></form>}
