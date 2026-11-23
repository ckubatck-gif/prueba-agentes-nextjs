import type { BookableDay } from "./types";

// Las fechas YYYY-MM-DD se formatean en UTC para que el día no cambie según la zona del servidor.
const longDate = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const weekdayShort = new Intl.DateTimeFormat("es-ES", { weekday: "short", timeZone: "UTC" });
const monthShort = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "UTC" });
const monthLong = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const euros = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function stripDot(value: string): string {
  return value.replace(/\.$/, "");
}

/** "lunes, 23 de noviembre de 2026" */
export function formatDateLong(date: string): string {
  return longDate.format(toUtc(date));
}

/** "lunes, 23 de noviembre" */
export function formatDayMonth(date: string): string {
  return dayMonth.format(toUtc(date));
}

/** Datos de un día para pintar el selector de fechas. */
export function toBookableDay(date: string): BookableDay {
  const utc = toUtc(date);
  return {
    value: date,
    weekday: stripDot(weekdayShort.format(utc)),
    day: String(utc.getUTCDate()),
    month: stripDot(monthShort.format(utc)),
    monthLabel: monthLong.format(utc),
    label: dayMonth.format(utc),
  };
}

/** "89 €", "120,50 €" */
export function formatPrice(amount: number): string {
  return euros.format(amount);
}

/** "612345678" → "612 345 678" */
export function formatPhone(phone: string): string {
  return /^\d{9}$/.test(phone) ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : phone;
}

/** "1234BCD" → "1234 BCD"; "PO1234AB" → "PO-1234-AB" */
export function formatPlate(plate: string): string {
  const current = /^(\d{4})([A-Z]{3})$/.exec(plate);
  if (current) return `${current[1]} ${current[2]}`;
  const provincial = /^([A-Z]{1,2})(\d{4})([A-Z]{1,2})$/.exec(plate);
  if (provincial) return `${provincial[1]}-${provincial[2]}-${provincial[3]}`;
  return plate;
}
