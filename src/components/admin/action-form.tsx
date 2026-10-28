"use client";
import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

export function ActionForm({action,children,className,submitLabel="Save changes"}:{action:(state:ActionState,data:FormData)=>Promise<ActionState>,children:React.ReactNode,className?:string;submitLabel?:string}){
  const[state,formAction,pending]=useActionState(action,{});
  return (
    <form action={formAction} className={className}>
      {!pending&&state.error&&<p className="form-message error" role="alert">{state.error}</p>}
      {!pending&&state.success&&<p className="form-message success" role="status">{state.success}</p>}
      {children}
      {!pending&&state.error&&<p className="form-message error" role="alert">{state.error}</p>}
      {!pending&&state.success&&<p className="form-message success" role="status">{state.success}</p>}
      <div className="admin-form-sticky-bar">
        <button className="primary" disabled={pending}>
          {pending ? (
            <>
              <span className="admin-spinner" aria-hidden="true" />
              <span>Saving…</span>
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
export function LoginForm({action}:{action:(state:ActionState,data:FormData)=>Promise<ActionState>}){const[state,formAction,pending]=useActionState(action,{});return <form action={formAction} className="login-card"><div><span className="admin-kicker">Image Developments</span><h1>Admin sign in</h1><p>Manage website content securely.</p></div><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required/></label>{state.error&&<p className="form-message error">{state.error}</p>}<button className="primary" disabled={pending}>{pending?"Signing in…":"Sign in"}</button></form>}
