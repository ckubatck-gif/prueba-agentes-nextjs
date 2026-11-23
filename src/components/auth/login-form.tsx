"use client";

import { useActionState, useState } from "react";
import { signIn } from "@/app/actions/auth";
import { TextField } from "@/components/form/text-field";

/** Correo electrónico y contraseña con Supabase Auth. Los errores llegan traducidos desde la Server Action. */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, null);
  const [email, setEmail] = useState("");
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok && !state.fieldErrors ? state.error : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4" aria-busy={pending}>
      {formError ? (
        <p role="alert" className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-danger">
          {formError}
        </p>
      ) : null}
      <TextField
        id="login-email"
        name="email"
        label="Correo electrónico"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <TextField
        id="login-password"
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-workwear px-5 py-3 font-semibold text-paper hover:bg-workwear-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
