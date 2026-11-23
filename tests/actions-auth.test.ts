import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signIn, signOut } from "@/app/actions/auth";
import { GENERIC_ERROR } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import {
  buildFormData,
  expectRedirect,
  fakeClient,
  removeSupabaseEnv,
  simulateSupabaseDown,
  spyOnConsoleError,
  useFakeSupabaseEnv,
} from "./support/actions";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => undefined }),
}));
vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/server")>();
  return { ...actual, createClient: vi.fn(actual.createClient) };
});

const loginForm = () => buildFormData({ email: "taller@example.com", password: "contraseña-ficticia" });

beforeEach(() => {
  useFakeSupabaseEnv();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.mocked(createClient).mockReset();
});

describe("signIn no lanza excepciones (D8.4)", () => {
  it("sin variables de entorno devuelve { ok: false } en español", async () => {
    spyOnConsoleError();
    removeSupabaseEnv();
    expect(await signIn(null, loginForm())).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("si Supabase no responde devuelve { ok: false } en español", async () => {
    spyOnConsoleError();
    const fetchMock = simulateSupabaseDown();
    const result = await signIn(null, loginForm());
    expect(fetchMock).toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/No se ha podido iniciar sesión/) });
  });

  it("si el cliente de Supabase lanza, también devuelve { ok: false }", async () => {
    spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: { signInWithPassword: () => Promise.reject(new Error("socket hang up")) } }),
    );
    expect(await signIn(null, loginForm())).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("con credenciales incorrectas da el error en español sin anglicismos", async () => {
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({
        auth: { signInWithPassword: async () => ({ data: {}, error: { code: "invalid_credentials" } }) },
      }),
    );
    expect(await signIn(null, loginForm())).toEqual({
      ok: false,
      error: "Correo electrónico o contraseña incorrectos.",
    });
  });

  it("si el login va bien, el redirect() a /panel no se captura", async () => {
    const spy = spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: { signInWithPassword: async () => ({ data: {}, error: null }) } }),
    );
    await expectRedirect(signIn(null, loginForm()), "/panel");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("signOut no lanza excepciones (D8.4)", () => {
  it("sin variables de entorno devuelve { ok: false } en español", async () => {
    spyOnConsoleError();
    removeSupabaseEnv();
    expect(await signOut()).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("si el cliente de Supabase lanza, también devuelve { ok: false }", async () => {
    spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: { signOut: () => Promise.reject(new Error("socket hang up")) } }),
    );
    expect(await signOut()).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("si Supabase devuelve un error, avisa en español", async () => {
    spyOnConsoleError();
    vi.mocked(createClient).mockResolvedValueOnce(
      fakeClient({ auth: { signOut: async () => ({ error: { code: "unexpected_failure" } }) } }),
    );
    expect(await signOut()).toEqual({ ok: false, error: "No se ha podido cerrar la sesión. Inténtalo de nuevo." });
  });

  it("si el cierre va bien, el redirect() a /login no se captura (cliente real, sin sesión)", async () => {
    const spy = spyOnConsoleError();
    simulateSupabaseDown();
    await expectRedirect(signOut(), "/login");
    expect(spy).not.toHaveBeenCalled();
  });
});
