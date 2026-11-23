/** Falta configuración de Supabase. Las Server Actions la convierten en `{ ok: false }` (D8.4). */
export class SupabaseConfigError extends Error {
  name = "SupabaseConfigError";
}

/** Lee las variables públicas de Supabase. Solo la clave publicable: nunca la secreta. */
export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new SupabaseConfigError(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example).",
    );
  }
  return { url, publishableKey };
}
