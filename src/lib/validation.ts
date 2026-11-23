import * as z from "zod";
import { isValidBookingCode, normalizeBookingCode } from "./booking-code";
import { SLOT_TIMES, isValidIsoDate } from "./schedule";
import { APPOINTMENT_STATUSES } from "./status";

const PHONE_RE = /^[6-9]\d{8}$/;
const CURRENT_PLATE_RE = /^\d{4}[BCDFGHJKLMNPRSTVWXYZ]{3}$/;
const PROVINCES =
  "A|AB|AL|AV|B|BA|BI|BU|C|CA|CC|CE|CO|CR|CS|CU|GC|GE|GI|GR|GU|H|HU|IB|J|L|LE|LO|LU|M|MA|ML|MU|NA|O|OR|OU|P|PM|PO|S|SA|SE|SG|SO|SS|T|TE|TF|TO|V|VA|VI|Z|ZA";
const PROVINCIAL_PLATE_RE = new RegExp(`^(${PROVINCES})\\d{4}[A-Z]{1,2}$`);
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

/** Longitud en caracteres reales (como char_length de Postgres), no en unidades UTF-16. */
export function charLength(value: string): number {
  return Array.from(value).length;
}

/** Quita espacios, puntos y guiones, y el prefijo +34 / 0034. */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s.-]/g, "").replace(/^(\+34|0034)/, "");
}

export function isValidPhone(normalized: string): boolean {
  return PHONE_RE.test(normalized);
}

/** Mayúsculas, sin espacios ni guiones: "po-1234-ab" → "PO1234AB". */
export function normalizePlate(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

/** Matrícula actual (1234BCD, sin vocales, Ñ ni Q) o provincial (PO1234AB). */
export function isValidPlate(normalized: string): boolean {
  return CURRENT_PLATE_RE.test(normalized) || PROVINCIAL_PLATE_RE.test(normalized);
}

/** Lee un campo de texto de un FormData; lo que no sea texto cuenta como vacío. */
export function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** Primer mensaje de error por campo, listo para pintarlo junto a cada input. */
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in result)) result[key] = issue.message;
  }
  return result;
}

export const isoDateSchema = z
  .string()
  .refine(isValidIsoDate, { error: "Elige una fecha válida." });

export const bookingSchema = z.object({
  serviceSlug: z.string().regex(SLUG_RE, { error: "Elige un servicio." }),
  date: isoDateSchema,
  time: z.enum(SLOT_TIMES, { error: "Elige una hora." }),
  name: z
    .string()
    .trim()
    .refine((value) => charLength(value) >= 2, { error: "Escribe tu nombre (mínimo 2 caracteres)." })
    .refine((value) => charLength(value) <= 80, { error: "El nombre no puede pasar de 80 caracteres." })
    .refine((value) => !CONTROL_CHARS_RE.test(value), { error: "El nombre contiene caracteres no válidos." }),
  phone: z
    .string()
    .transform(normalizePhone)
    .refine(isValidPhone, {
      error: "Escribe un teléfono español de 9 cifras que empiece por 6, 7, 8 o 9.",
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, { error: "El correo electrónico es demasiado largo." })
    .pipe(z.union([z.literal(""), z.email({ error: "Escribe un correo electrónico válido o déjalo vacío." })]))
    .transform((value) => (value === "" ? null : value)),
  plate: z
    .string()
    .transform(normalizePlate)
    .refine(isValidPlate, { error: "Escribe una matrícula válida, por ejemplo 1234 BCD o PO-1234-AB." }),
  notes: z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").trim())
    .refine((value) => charLength(value) <= 500, { error: "El comentario no puede pasar de 500 caracteres." })
    .transform((value) => (value === "" ? null : value)),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const availabilitySchema = z.object({ date: isoDateSchema });

export const signInSchema = z.object({
  email: z.string().trim().pipe(z.email({ error: "Escribe un correo electrónico válido." })),
  password: z.string().min(1, { error: "Escribe la contraseña." }).max(128, { error: "Contraseña demasiado larga." }),
});

export const updateStatusSchema = z.object({
  id: z.uuid({ error: "Cita no válida." }),
  status: z.enum(APPOINTMENT_STATUSES, { error: "Estado no válido." }),
});

export const bookingCodeSchema = z
  .string()
  .transform(normalizeBookingCode)
  .refine(isValidBookingCode, { error: "El código tiene 8 caracteres (letras y números)." });
