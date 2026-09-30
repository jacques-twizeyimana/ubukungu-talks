"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

const field =
  "border border-ink bg-card px-2.5 py-2.5 font-cond text-[15px] leading-none font-medium tracking-normal normal-case text-ink outline-none focus:border-accent";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="label-cond flex flex-col gap-1.5 text-muted">
        Email
        <input name="email" type="email" required autoComplete="username" className={field} />
      </label>
      <label className="label-cond flex flex-col gap-1.5 text-muted">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      {state?.error && <p className="m-0 font-cond text-sm text-accent">{state.error}</p>}
      <button
        disabled={pending}
        className="cursor-pointer border-0 bg-accent px-4 py-3 font-cond text-sm leading-none font-semibold tracking-[.06em] text-white uppercase hover:bg-accent-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
