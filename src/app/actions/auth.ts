"use server";

import { redirect } from "next/navigation";
import { guardAction } from "@/lib/action-guard";
import { translateAuthError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { readField, signInSchema, toFieldErrors } from "@/lib/validation";

/** Inicia sesión con Supabase Auth (correo electrónico y contraseña). Si va bien, lleva al panel. */
export async function signIn(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const result = await guardAction("auth.signIn", () => startSession(formData));
  if (!result.ok) return result;
  // redirect() lanza una excepción interna de Next: va fuera de guardAction para que nadie la capture.
  redirect("/panel");
}

/** Cierra la sesión y vuelve a /login. */
export async function signOut(): Promise<ActionResult> {
  const result = await guardAction("auth.signOut", endSession);
  if (!result.ok) return result;
  redirect("/login");
}

async function startSession(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse({
    email: readField(formData, "email"),
    password: readField(formData, "password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: translateAuthError(error.code) };
  return { ok: true, data: null };
}

async function endSession(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth] signOut falló", error.code);
    return { ok: false, error: "No se ha podido cerrar la sesión. Inténtalo de nuevo." };
  }
  return { ok: true, data: null };
}
