import { notFound, redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";
import { guardAction } from "@/lib/action-guard";
import { GENERIC_ERROR } from "@/lib/errors";
import { SupabaseConfigError } from "@/lib/supabase/env";
import type { ActionResult } from "@/lib/types";
import { expectRedirect, loggedText, spyOnConsoleError } from "./support/actions";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("guardAction (D8.4)", () => {
  it("devuelve tal cual el resultado de la acción", async () => {
    const ok: ActionResult<number> = { ok: true, data: 7 };
    const failed: ActionResult<number> = { ok: false, error: "Elige una hora." };
    expect(await guardAction("prueba", async () => ok)).toBe(ok);
    expect(await guardAction("prueba", async () => failed)).toBe(failed);
  });

  it("convierte cualquier excepción en { ok: false } con un mensaje en español", async () => {
    spyOnConsoleError();
    const result = await guardAction<null>("prueba", async () => {
      throw new SupabaseConfigError("Faltan variables");
    });
    expect(result).toEqual({ ok: false, error: GENERIC_ERROR });
    expect(GENERIC_ERROR).toMatch(/Inténtalo de nuevo/);

    const rejected = await guardAction<null>("prueba", () => Promise.reject("sin conexión"));
    expect(rejected).toEqual({ ok: false, error: GENERIC_ERROR });
  });

  it("registra solo el nombre del error, nunca su mensaje", async () => {
    const spy = spyOnConsoleError();
    await guardAction<null>("prueba", async () => {
      throw new Error("Key (phone)=(612345678) already exists");
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(loggedText(spy)).toContain("[prueba]");
    expect(loggedText(spy)).not.toContain("612345678");
  });

  it("no captura el redirect() ni el notFound() de Next", async () => {
    const spy = spyOnConsoleError();
    await expectRedirect(
      guardAction<null>("prueba", async () => redirect("/panel")),
      "/panel",
    );
    await expect(guardAction<null>("prueba", async () => notFound())).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
    expect(spy).not.toHaveBeenCalled();
  });
});
