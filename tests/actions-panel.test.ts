import { refresh } from "next/cache";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateStatus } from "@/app/actions/panel";
import { GENERIC_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  NETWORK_ERROR,
  buildFormData,
  fakeClient,
  fakeQuery,
  loggedText,
  removeSupabaseEnv,
  simulateSupabaseDown,
  spyOnConsoleError,
  useFakeSupabaseEnv,
} from "./support/actions";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => undefined }),
}));
vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/server")>();
  return { ...actual, createClient: vi.fn(actual.createClient) };
});

const APPOINTMENT_ID = "3f2b8c1e-9a4d-4c6b-8e2f-1a2b3c4d5e6f";
const STAFF_ID = "0b6c2a51-7d3e-4f80-9a1b-2c3d4e5f6a7b";
const statusForm = () => buildFormData({ id: APPOINTMENT_ID, status: "confirmada" });
const signedIn = { getClaims: async () => ({ data: { claims: { sub: STAFF_ID } }, error: null }) };
const staffRow = { data: { user_id: STAFF_ID, display_name: "Taller" }, error: null };

beforeEach(() => {
  useFakeSupabaseEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.mocked(createClient).mockReset();
  vi.mocked(refresh).mockClear();
});

describe("updateStatus no lanza excepciones (D8.4)", () => {
  it("si falla la lectura de staff devuelve { ok: false } en español (antes acababa en error.tsx)", async () => {
    const spy = spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: signedIn, from: () => fakeQuery({ data: null, error: NETWORK_ERROR }) }),
    );
    expect(await updateStatus(null, statusForm())).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(refresh).not.toHaveBeenCalled();
    expect(loggedText(spy)).toContain("staff");
  });

  it("si la comprobación de la sesión lanza, también devuelve { ok: false }", async () => {
    spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: { getClaims: () => Promise.reject(new Error("socket hang up")) } }),
    );
    expect(await updateStatus(null, statusForm())).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("sin variables de entorno devuelve { ok: false } en español", async () => {
    const spy = spyOnConsoleError();
    removeSupabaseEnv();
    expect(await updateStatus(null, statusForm())).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(loggedText(spy)).toContain("SupabaseConfigError");
  });

  it("con el cliente real, sin sesión y sin red, pide volver a entrar sin lanzar", async () => {
    simulateSupabaseDown();
    expect(await updateStatus(null, statusForm())).toEqual({
      ok: false,
      error: "Tu sesión ha caducado o no tienes acceso al panel.",
    });
  });

  it("si falla la lectura de la cita devuelve { ok: false } en español", async () => {
    spyOnConsoleError();
    const tables: Record<string, ReturnType<typeof fakeQuery>> = {
      staff: fakeQuery(staffRow),
      appointments: fakeQuery({ data: null, error: NETWORK_ERROR }),
    };
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: signedIn, from: (table: string) => tables[table] }),
    );
    expect(await updateStatus(null, statusForm())).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("con todo bien cambia el estado y refresca el panel", async () => {
    const reads = [{ data: { status: "pendiente" }, error: null }, { data: { id: APPOINTMENT_ID, status: "confirmada" }, error: null }];
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({
        auth: signedIn,
        from: (table: string) => fakeQuery(table === "staff" ? staffRow : (reads.shift() ?? { data: null, error: null })),
      }),
    );
    expect(await updateStatus(null, statusForm())).toEqual({
      ok: true,
      data: { id: APPOINTMENT_ID, status: "confirmada" },
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
