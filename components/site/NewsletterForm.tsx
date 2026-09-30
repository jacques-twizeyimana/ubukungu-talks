"use client";

import { useActionState } from "react";
import { subscribe, type NewsletterState } from "@/app/actions/newsletter";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(subscribe, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex border border-paper">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email for the Friday brief"
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3.5 font-cond text-base leading-none text-paper outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer border-0 bg-paper px-[18px] font-cond text-sm leading-none font-semibold tracking-[.06em] text-ink uppercase disabled:opacity-60"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      <p aria-live="polite" className={`m-0 min-h-5 font-cond text-sm ${state?.ok ? "text-[#CFE3CF]" : "text-accent-wash"}`}>
        {state?.message}
      </p>
    </form>
  );
}
