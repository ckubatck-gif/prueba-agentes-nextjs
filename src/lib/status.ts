import type { AppointmentStatus } from "./types";

export const APPOINTMENT_STATUSES = ["pendiente", "confirmada", "completada", "cancelada"] as const;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
};

/** Texto del botón que lleva a cada estado (a "pendiente" no se vuelve nunca). */
export const STATUS_ACTION_LABELS: Record<Exclude<AppointmentStatus, "pendiente">, string> = {
  confirmada: "Confirmar",
  completada: "Marcar completada",
  cancelada: "Cancelar cita",
};

const TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pendiente: ["confirmada", "cancelada"],
  confirmada: ["completada", "cancelada"],
  completada: [],
  cancelada: [],
};

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

/** pendiente → confirmada → completada; cualquiera salvo completada puede cancelarse. */
export function allowedTransitions(status: AppointmentStatus): readonly AppointmentStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Estados que siguen ocupando un hueco en la agenda. */
export function isActiveStatus(status: AppointmentStatus): boolean {
  return status === "pendiente" || status === "confirmada";
}
