"use client";

import { useActionState } from "react";
import { signOut } from "@/app/actions/auth";

export function SignOutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, formAction, pending] = useActionState(signOut, null);
  const style =
    tone === "dark"
      ? "border-ink text-ink hover:bg-concrete"
      : "border-paper text-paper hover:bg-paper hover:text-workwear";

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md border-2 px-4 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${style}`}
      >
        {pending ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
      {state && !state.ok ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
