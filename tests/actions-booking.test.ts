import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBooking, getAvailability } from "@/app/actions/booking";
import { GENERIC_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  buildFormData,
  fakeClient,
  loggedText,
  removeSupabaseEnv,
  simulateSupabaseDown,
  spyOnConsoleError,
  useFakeSupabaseEnv,
} from "./support/actions";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => undefined }),
}));
// Por defecto, el cliente de verdad (@supabase/ssr); cada prueba puede sustituirlo por uno falso.
vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/server")>();
  return { ...actual, createClient: vi.fn(actual.createClient) };
});

// Miércoles 25/11/2026 a las 09:00 en Madrid; el viernes 27 a las 10:00 es un hueco válido.
const NOW = new Date("2026-11-25T08:00:00Z");
const FRIDAY = "2026-11-27";
const PERSONAL = { name: "María López", phone: "612 345 678", email: "maria@ejemplo.es", plate: "1234 BCD" };
const bookingForm = () =>
  buildFormData({ serviceSlug: "aceite", date: FRIDAY, time: "10:00", notes: "", ...PERSONAL });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  useFakeSupabaseEnv();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.mocked(createClient).mockReset();
});

describe("getAvailability no lanza excepciones (D8.4)", () => {
  it("sin variables de entorno devuelve { ok: false } en español", async () => {
    const spy = spyOnConsoleError();
    removeSupabaseEnv();
    expect(await getAvailability(FRIDAY)).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(loggedText(spy)).toContain("SupabaseConfigError");
  });

  it("si Supabase no responde devuelve { ok: false } en español", async () => {
    spyOnConsoleError();
    const fetchMock = simulateSupabaseDown();
    expect(await getAvailability(FRIDAY)).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("si el cliente de Supabase lanza, también devuelve { ok: false }", async () => {
    spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ rpc: () => Promise.reject(new Error("socket hang up")) }),
    );
    expect(await getAvailability(FRIDAY)).toEqual({ ok: false, error: GENERIC_ERROR });
  });
});

describe("createBooking no lanza excepciones (D8.4)", () => {
  it("sin variables de entorno devuelve { ok: false } en español", async () => {
    spyOnConsoleError();
    removeSupabaseEnv();
    expect(await createBooking(null, bookingForm())).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("si Supabase no responde devuelve { ok: false } y no registra datos personales", async () => {
    const spy = spyOnConsoleError();
    const fetchMock = simulateSupabaseDown();
    expect(await createBooking(null, bookingForm())).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(fetchMock).toHaveBeenCalled();
    const logs = loggedText(spy);
    for (const value of ["María", "612", "maria@", "1234"]) expect(logs).not.toContain(value);
  });

  it("si el cliente de Supabase lanza, también devuelve { ok: false }", async () => {
    spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ rpc: () => Promise.reject(new Error("socket hang up")) }),
    );
    expect(await createBooking(null, bookingForm())).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("sigue traduciendo los errores de negocio de la base de datos", async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ rpc: async () => ({ data: null, error: { code: "P0001", message: "SLOT_TAKEN" } }) }),
    );
    const result = await createBooking(null, bookingForm());
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/acaba de ocuparse/) });
  });
});
