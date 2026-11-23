import { describe, expect, it } from "vitest";
import {
  availabilitySchema,
  bookingCodeSchema,
  bookingSchema,
  charLength,
  isValidPhone,
  isValidPlate,
  normalizePhone,
  normalizePlate,
  readField,
  signInSchema,
  toFieldErrors,
  updateStatusSchema,
} from "@/lib/validation";
import { isValidBookingCode, normalizeBookingCode } from "@/lib/booking-code";

const validBooking = {
  serviceSlug: "aceite",
  date: "2026-11-27",
  time: "10:00",
  name: "María López",
  phone: "612 345 678",
  email: "",
  plate: "1234 bcd",
  notes: "",
};

describe("teléfono (D4.2)", () => {
  it.each([
    ["612345678", "612345678"],
    ["612 345 678", "612345678"],
    ["+34 612 345 678", "612345678"],
    ["0034612345678", "612345678"],
    ["+34612345678", "612345678"],
    ["986.12.34.56", "986123456"],
    ["712-345-678", "712345678"],
    ["812345678", "812345678"],
  ])("normaliza %s y lo acepta", (raw, normalized) => {
    expect(normalizePhone(raw)).toBe(normalized);
    expect(isValidPhone(normalizePhone(raw))).toBe(true);
  });

  it.each(["512345678", "12345678", "6123456789", "61234567a", "+33 612 345 678", "", "34612345678"])(
    "rechaza %s",
    (raw) => {
      expect(isValidPhone(normalizePhone(raw))).toBe(false);
    },
  );
});

describe("matrícula (D4.3)", () => {
  it.each([
    ["1234 BCD", "1234BCD"],
    ["1234-bcd", "1234BCD"],
    ["0000ZZZ", "0000ZZZ"],
    ["PO-1234-AB", "PO1234AB"],
    ["po 1234 a", "PO1234A"],
    ["M-5678-XY", "M5678XY"],
  ])("normaliza %s a %s y la acepta", (raw, normalized) => {
    expect(normalizePlate(raw)).toBe(normalized);
    expect(isValidPlate(normalizePlate(raw))).toBe(true);
  });

  it.each([
    ["1234 BAD", "tiene vocal"],
    ["1234 BÑD", "tiene Ñ"],
    ["1234 BQD", "tiene Q"],
    ["123 BCD", "faltan cifras"],
    ["1234 BC", "faltan letras"],
    ["XX-1234-AB", "provincia inexistente"],
    ["PO-123-AB", "faltan cifras en la provincial"],
    ["PO-1234-ABC", "sobran letras en la provincial"],
    ["", "vacía"],
  ])("rechaza %s (%s)", (raw) => {
    expect(isValidPlate(normalizePlate(raw))).toBe(false);
  });
});

describe("código de reserva", () => {
  it("normaliza y valida", () => {
    expect(normalizeBookingCode(" k7m2-xq9p ")).toBe("K7M2XQ9P");
    expect(isValidBookingCode("K7M2XQ9P")).toBe(true);
    expect(isValidBookingCode("K7M2XQ9")).toBe(false);
    expect(isValidBookingCode("K7M2XQ0P")).toBe(false);
    expect(isValidBookingCode("IIIIOOOO")).toBe(false);
  });

  it("bookingCodeSchema devuelve el código normalizado o un error en español", () => {
    expect(bookingCodeSchema.parse("k7m2 xq9p")).toBe("K7M2XQ9P");
    const result = bookingCodeSchema.safeParse("abc");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/8 caracteres/);
  });
});

describe("bookingSchema (D4.1–D4.4)", () => {
  it("acepta una reserva válida y la normaliza", () => {
    const result = bookingSchema.parse(validBooking);
    expect(result).toEqual({
      serviceSlug: "aceite",
      date: "2026-11-27",
      time: "10:00",
      name: "María López",
      phone: "612345678",
      email: null,
      plate: "1234BCD",
      notes: null,
    });
  });

  it("nombre entre 2 y 80 caracteres reales", () => {
    expect(bookingSchema.safeParse({ ...validBooking, name: "A" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, name: "  A  " }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, name: "Al" }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, name: "a".repeat(80) }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, name: "a".repeat(81) }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, name: "Ana\u0007" }).success).toBe(false);
  });

  it("cuenta caracteres como Postgres (un emoji es 1)", () => {
    expect(charLength("😀")).toBe(1);
    expect(bookingSchema.safeParse({ ...validBooking, name: "😀" }).success).toBe(false);
  });

  it("email opcional pero válido si se rellena; se guarda en minúsculas", () => {
    expect(bookingSchema.parse({ ...validBooking, email: "  Maria@Ejemplo.ES " }).email).toBe("maria@ejemplo.es");
    expect(bookingSchema.safeParse({ ...validBooking, email: "maria@" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, email: "no-es-un-email" }).success).toBe(false);
    expect(bookingSchema.parse({ ...validBooking, email: "   " }).email).toBeNull();
  });

  it("los errores del correo dicen «correo electrónico», no «email» (D7.8)", () => {
    const booking = bookingSchema.safeParse({ ...validBooking, email: "maria@" });
    const signIn = signInSchema.safeParse({ email: "taller", password: "x" });
    expect(booking.success || signIn.success).toBe(false);
    if (booking.success || signIn.success) return;
    const messages = [toFieldErrors(booking.error).email, toFieldErrors(signIn.error).email];
    for (const message of messages) {
      expect(message).toMatch(/correo electrónico/);
      expect(message).not.toMatch(/e-?mail/i);
    }
  });

  it("comentario de 500 caracteres como máximo (los saltos de línea CRLF cuentan como uno)", () => {
    expect(bookingSchema.safeParse({ ...validBooking, notes: "x".repeat(500) }).success).toBe(true);
    expect(bookingSchema.safeParse({ ...validBooking, notes: "x".repeat(501) }).success).toBe(false);
    const withNewlines = `${"x".repeat(249)}\r\n${"y".repeat(250)}`;
    expect(bookingSchema.parse({ ...validBooking, notes: withNewlines }).notes).toHaveLength(500);
  });

  it("rechaza hora, fecha o servicio con formato incorrecto", () => {
    expect(bookingSchema.safeParse({ ...validBooking, time: "13:00" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, date: "2026-02-30" }).success).toBe(false);
    expect(bookingSchema.safeParse({ ...validBooking, serviceSlug: "Aceite!" }).success).toBe(false);
  });

  it("devuelve errores por campo en español", () => {
    const result = bookingSchema.safeParse({ ...validBooking, phone: "512", plate: "XYZ", name: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = toFieldErrors(result.error);
    expect(Object.keys(errors).sort()).toEqual(["name", "phone", "plate"]);
    expect(errors.phone).toMatch(/teléfono español/);
    expect(errors.plate).toMatch(/matrícula/);
    expect(errors.name).toMatch(/nombre/);
  });
});

describe("otros esquemas", () => {
  it("availabilitySchema valida la fecha", () => {
    expect(availabilitySchema.safeParse({ date: "2026-11-27" }).success).toBe(true);
    expect(availabilitySchema.safeParse({ date: "27-11-2026" }).success).toBe(false);
  });

  it("signInSchema exige email válido y contraseña", () => {
    expect(signInSchema.safeParse({ email: "taller@example.com", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "taller", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "taller@example.com", password: "" }).success).toBe(false);
  });

  it("updateStatusSchema exige uuid y un estado conocido", () => {
    const id = "3f2b8c1e-9a4d-4c6b-8e2f-1a2b3c4d5e6f";
    expect(updateStatusSchema.safeParse({ id, status: "confirmada" }).success).toBe(true);
    expect(updateStatusSchema.safeParse({ id, status: "borrada" }).success).toBe(false);
    expect(updateStatusSchema.safeParse({ id: "1", status: "confirmada" }).success).toBe(false);
  });
});

describe("readField", () => {
  it("lee texto y trata lo demás como vacío", () => {
    const form = new FormData();
    form.set("name", "Ana");
    form.set("file", new Blob(["x"]), "x.txt");
    expect(readField(form, "name")).toBe("Ana");
    expect(readField(form, "file")).toBe("");
    expect(readField(form, "missing")).toBe("");
  });
});
