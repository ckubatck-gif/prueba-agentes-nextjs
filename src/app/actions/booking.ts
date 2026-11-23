"use server";

import { GENERIC_ERROR, errorStep, extractDbErrorCode, translateDbError } from "@/lib/errors";
import { checkSlot, getFreeSlots, isDateInRange, isWorkingDay } from "@/lib/schedule";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Availability, BookingCreated } from "@/lib/types";
import { availabilitySchema, bookingSchema, readField, toFieldErrors } from "@/lib/validation";

/** Horas libres de un día laborable (solo horas: nada personal). */
export async function getAvailability(date: string): Promise<ActionResult<Availability>> {
  const parsed = availabilitySchema.safeParse({ date });
  if (!parsed.success) return { ok: false, error: "Elige una fecha válida." };

  const day = parsed.data.date;
  const now = new Date();
  if (!isWorkingDay(day) || !isDateInRange(day, now)) {
    return { ok: false, error: translateDbError("INVALID_DATE") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("taken_slots", { p_date: day });
  if (error) {
    console.error("[booking] taken_slots falló", error.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true, data: { date: day, slots: getFreeSlots(day, data.map((row) => row.slot), now) } };
}

/** Valida con zod, repite las reglas de horario y reserva con la función SQL book_appointment. */
export async function createBooking(
  _previous: ActionResult<BookingCreated> | null,
  formData: FormData,
): Promise<ActionResult<BookingCreated>> {
  const parsed = bookingSchema.safeParse({
    serviceSlug: readField(formData, "serviceSlug"),
    date: readField(formData, "date"),
    time: readField(formData, "time"),
    name: readField(formData, "name"),
    phone: readField(formData, "phone"),
    email: readField(formData, "email"),
    plate: readField(formData, "plate"),
    notes: readField(formData, "notes"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisa los campos marcados.", fieldErrors: toFieldErrors(parsed.error) };
  }

  const input = parsed.data;
  const slot = checkSlot(input.date, input.time, new Date());
  if (!slot.ok) return scheduleError(slot.reason);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_appointment", {
    p_service_slug: input.serviceSlug,
    p_date: input.date,
    p_time: input.time,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email ?? undefined,
    p_plate: input.plate,
    p_notes: input.notes ?? undefined,
  });

  if (error || !data) {
    const code = extractDbErrorCode(error?.message);
    if (!code) console.error("[booking] book_appointment falló", error?.code);
    return scheduleError(code);
  }

  return { ok: true, data: { code: data } };
}

/** Si el problema es la hora o el día, el error va en ese campo para que el formulario vuelva a ese paso. */
function scheduleError(code: string | null): ActionResult<BookingCreated> {
  const message = translateDbError(code);
  const step = errorStep(code);
  return step ? { ok: false, error: message, fieldErrors: { [step]: message } } : { ok: false, error: message };
}
