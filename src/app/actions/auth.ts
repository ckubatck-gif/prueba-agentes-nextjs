"use server";

import { redirect } from "next/navigation";
import { translateAuthError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { readField, signInSchema, toFieldErrors } from "@/lib/validation";

/** Inicia sesión con Supabase Auth (email + contraseña). Si va bien, lleva al panel. */
export async function signIn(_previous: ActionResult | null, formData: FormData): Promise<ActionResult> {
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

  redirect("/panel");
}

/** Cierra la sesión y vuelve a /login. */
export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth] signOut falló", error.code);
    return { ok: false, error: "No se ha podido cerrar la sesión. Inténtalo de nuevo." };
  }

  redirect("/login");
}
