"use server";

import { refresh } from "next/cache";
import { guardAction } from "@/lib/action-guard";
import { translateDbError } from "@/lib/errors";
import { STATUS_LABELS, canTransition } from "@/lib/status";
import { getCurrentStaff } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, AppointmentStatus } from "@/lib/types";
import { readField, updateStatusSchema } from "@/lib/validation";

type StatusChange = { id: string; status: AppointmentStatus };

/**
 * Cambia el estado de una cita. Solo personal del taller; nunca toca los datos del cliente.
 * Si falla la lectura de `staff` o Supabase no responde, devuelve `{ ok: false }` en vez de lanzar.
 */
export async function updateStatus(
  _previous: ActionResult<StatusChange> | null,
  formData: FormData,
): Promise<ActionResult<StatusChange>> {
  return guardAction("panel.updateStatus", () => changeStatus(formData));
}

async function changeStatus(formData: FormData): Promise<ActionResult<StatusChange>> {
  const parsed = updateStatusSchema.safeParse({
    id: readField(formData, "id"),
    status: readField(formData, "status"),
  });
  if (!parsed.success) return { ok: false, error: "Petición no válida." };
  const { id, status } = parsed.data;

  const supabase = await createClient();
  const { staff } = await getCurrentStaff(supabase);
  if (!staff) return { ok: false, error: "Tu sesión ha caducado o no tienes acceso al panel." };

  const { data: current, error: readError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (readError) {
    console.error("[panel] lectura de la cita falló", readError.code);
    return { ok: false, error: translateDbError(readError.message) };
  }
  if (!current) return { ok: false, error: "No se ha encontrado la cita." };
  if (!canTransition(current.status, status)) {
    return {
      ok: false,
      error: `No se puede pasar de «${STATUS_LABELS[current.status]}» a «${STATUS_LABELS[status]}».`,
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();
  if (error) {
    console.error("[panel] cambio de estado falló", error.code);
    return { ok: false, error: translateDbError(error.message) };
  }
  if (!data) return { ok: false, error: "No se ha encontrado la cita." };

  refresh();
  return { ok: true, data: { id: data.id, status: data.status } };
}
