import type { MadridNow, SlotCheck } from "./types";

export const TIME_ZONE = "Europe/Madrid";
export const SLOT_TIMES = ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"] as const;
export const MAX_DAYS_AHEAD = 60;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const madridFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "Hoy" y "ahora" en Madrid, sea cual sea la zona horaria del servidor. */
export function getMadridNow(now: Date): MadridNow {
  const parts: Record<string, string> = {};
  for (const part of madridFormatter.formatToParts(now)) {
    parts[part.type] = part.value;
  }
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function toUtcDate(date: string): Date | null {
  const match = ISO_DATE_RE.exec(date);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  const sameDay =
    result.getUTCFullYear() === year &&
    result.getUTCMonth() === month - 1 &&
    result.getUTCDate() === day;
  return sameDay ? result : null;
}

/** YYYY-MM-DD que existe en el calendario (rechaza 2026-02-30). */
export function isValidIsoDate(date: string): boolean {
  return toUtcDate(date) !== null;
}

export function addDays(date: string, days: number): string {
  const base = toUtcDate(date);
  if (!base) throw new RangeError(`Fecha no válida: ${date}`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export function isoWeekday(date: string): number {
  const parsed = toUtcDate(date);
  if (!parsed) throw new RangeError(`Fecha no válida: ${date}`);
  const day = parsed.getUTCDay();
  return day === 0 ? 7 : day;
}

export function isWorkingDay(date: string): boolean {
  return isValidIsoDate(date) && isoWeekday(date) <= 5;
}

export function isSlotTime(value: string): value is (typeof SLOT_TIMES)[number] {
  return (SLOT_TIMES as readonly string[]).includes(value);
}

/** Entre hoy y hoy + 60 días (ambos incluidos), en horario de Madrid. */
export function isDateInRange(date: string, now: Date): boolean {
  if (!isValidIsoDate(date)) return false;
  const today = getMadridNow(now).date;
  return date >= today && date <= addDays(today, MAX_DAYS_AHEAD);
}

/** Una hora ya pasada no se puede reservar, tampoco la que está empezando ahora mismo. */
export function isPastSlot(date: string, time: string, now: Date): boolean {
  const madrid = getMadridNow(now);
  if (date !== madrid.date) return date < madrid.date;
  return time <= madrid.time;
}

/** Repite las reglas de horario que también comprueba book_appointment en la base de datos. */
export function checkSlot(date: string, time: string, now: Date): SlotCheck {
  if (!isWorkingDay(date) || !isDateInRange(date, now)) {
    return { ok: false, reason: "INVALID_DATE" };
  }
  if (!isSlotTime(time) || isPastSlot(date, time, now)) {
    return { ok: false, reason: "INVALID_SLOT" };
  }
  return { ok: true };
}

/** Horas libres de un día: las del horario menos las ocupadas y las ya pasadas. */
export function getFreeSlots(date: string, taken: readonly string[], now: Date): string[] {
  if (!isWorkingDay(date) || !isDateInRange(date, now)) return [];
  const occupied = new Set(taken.map((slot) => slot.slice(0, 5)));
  return SLOT_TIMES.filter((slot) => !occupied.has(slot) && !isPastSlot(date, slot, now));
}

/** Días laborables de hoy a 60 días vista; hoy solo si aún queda alguna hora por delante. */
export function getBookableDates(now: Date): string[] {
  const today = getMadridNow(now).date;
  const dates: string[] = [];
  for (let offset = 0; offset <= MAX_DAYS_AHEAD; offset += 1) {
    const date = addDays(today, offset);
    if (getFreeSlots(date, [], now).length > 0) dates.push(date);
  }
  return dates;
}
