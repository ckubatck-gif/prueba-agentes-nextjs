// Utilidades para probar las Server Actions sin red ni Supabase (D8.4).
import { expect, vi, type MockInstance } from "vitest";
import type { ServerSupabaseClient } from "@/lib/supabase/server";

/** Valores ficticios: el dominio no existe y la clave no es real. */
export function useFakeSupabaseEnv(): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://ficticio.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "clave-ficticia");
}

/** Simula un despliegue sin las variables de Supabase. */
export function removeSupabaseEnv(): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
}

/** Supabase no responde: toda petición HTTP falla como lo hace `fetch` sin conexión. */
export function simulateSupabaseDown(): MockInstance<typeof fetch> {
  const failingFetch = vi.fn<typeof fetch>(async () => {
    throw new TypeError("fetch failed");
  });
  vi.stubGlobal("fetch", failingFetch);
  return failingFetch;
}

export function buildFormData(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

/** Silencia console.error y permite revisar que no se registran datos personales. */
export function spyOnConsoleError(): MockInstance<typeof console.error> {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

export function loggedText(spy: MockInstance<typeof console.error>): string {
  return spy.mock.calls.map((args) => args.map(String).join(" ")).join("\n");
}

/** Cliente falso con solo lo que usa cada prueba. */
export function fakeClient(partial: object): ServerSupabaseClient {
  return partial as unknown as ServerSupabaseClient;
}

/** Consulta encadenable de PostgREST que termina en `.maybeSingle()` con el resultado dado. */
export function fakeQuery(result: { data: unknown; error: { code: string; message: string } | null }) {
  const query = {
    select: () => query,
    update: () => query,
    eq: () => query,
    maybeSingle: async () => result,
  };
  return query;
}

/** Error de red tal y como lo devuelve postgrest-js cuando `fetch` falla. */
export const NETWORK_ERROR = { code: "", message: "TypeError: fetch failed" };

/** El redirect() de Next sale de la acción como su excepción especial, sin que nadie la capture. */
export async function expectRedirect(promise: Promise<unknown>, path: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({
    message: "NEXT_REDIRECT",
    digest: expect.stringContaining(`;${path};`),
  });
}
