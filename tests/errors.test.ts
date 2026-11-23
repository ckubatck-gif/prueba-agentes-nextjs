import { describe, expect, it } from "vitest";
import { GENERIC_ERROR, errorStep, extractDbErrorCode, translateAuthError, translateDbError } from "@/lib/errors";

describe("traducción de errores", () => {
  it("reconoce los códigos de negocio de Postgres", () => {
    expect(extractDbErrorCode("SLOT_TAKEN")).toBe("SLOT_TAKEN");
    expect(extractDbErrorCode('P0001: TOO_MANY_BOOKINGS')).toBe("TOO_MANY_BOOKINGS");
    expect(extractDbErrorCode("duplicate key value violates unique constraint")).toBeNull();
    expect(extractDbErrorCode(undefined)).toBeNull();
  });

  it("traduce SLOT_TAKEN y el resto a mensajes en español", () => {
    expect(translateDbError("SLOT_TAKEN")).toBe("Esa hora acaba de ocuparse. Elige otra, por favor.");
    expect(translateDbError("TOO_MANY_BOOKINGS")).toMatch(/3 citas/);
    expect(translateDbError("INVALID_DATE")).toMatch(/fecha/);
    expect(translateDbError("INVALID_SLOT")).toMatch(/hora/);
    expect(translateDbError("INVALID_SERVICE")).toMatch(/servicio/);
    expect(translateDbError("INVALID_TRANSITION")).toMatch(/estado/);
  });

  it("no filtra detalles internos de errores desconocidos", () => {
    expect(translateDbError('relation "public.appointments" does not exist')).toBe(GENERIC_ERROR);
    expect(translateDbError(null)).toBe(GENERIC_ERROR);
  });

  it("indica a qué paso volver cuando la hora o el día ya no valen", () => {
    expect(errorStep("SLOT_TAKEN")).toBe("time");
    expect(errorStep("INVALID_SLOT")).toBe("time");
    expect(errorStep("INVALID_DATE")).toBe("date");
    expect(errorStep("TOO_MANY_BOOKINGS")).toBeNull();
    expect(errorStep(null)).toBeNull();
  });

  it("traduce los errores de inicio de sesión", () => {
    expect(translateAuthError("invalid_credentials")).toBe("Correo electrónico o contraseña incorrectos.");
    expect(translateAuthError("email_not_confirmed")).toMatch(/correo electrónico/);
    expect(translateAuthError("over_request_rate_limit")).toMatch(/Demasiados intentos/);
    expect(translateAuthError(undefined)).toMatch(/No se ha podido iniciar sesión/);
  });
});
