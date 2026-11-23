// Sin dependencias: lo usa también el navegador (caja "¿Ya tienes cita?").
const BOOKING_CODE_RE = /^[A-HJ-NP-Z2-9]{8}$/;

/** " k7m2-xq9p " → "K7M2XQ9P" */
export function normalizeBookingCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

/** 8 caracteres sin letras ni cifras ambiguas (ni I, O, 0 ni 1), como genera book_appointment. */
export function isValidBookingCode(code: string): boolean {
  return BOOKING_CODE_RE.test(code);
}
