export type AppointmentStatus = "pendiente" | "confirmada" | "completada" | "cancelada";

/** Resultado de toda Server Action: nunca lanza errores crudos al usuario. */
export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type Service = {
  slug: string;
  name: string;
  durationMinutes: number;
  priceFrom: number;
};

/** Fecha y hora actuales en Europe/Madrid. `date` es YYYY-MM-DD y `time` HH:MM. */
export type MadridNow = {
  date: string;
  time: string;
};

export type SlotCheck = { ok: true } | { ok: false; reason: "INVALID_DATE" | "INVALID_SLOT" };

/** Día reservable ya formateado en el servidor para que el cliente no dependa de su reloj. */
export type BookableDay = {
  value: string;
  weekday: string;
  day: string;
  month: string;
  monthLabel: string;
  label: string;
};

export type BookingDetails = {
  name: string;
  phone: string;
  email: string;
  plate: string;
  notes: string;
};

export type Availability = {
  date: string;
  slots: string[];
};

export type BookingCreated = {
  code: string;
};

/** Lo que ve el cliente de su cita: nada personal. */
export type BookingSummary = {
  code: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
};

export type StaffMember = {
  userId: string;
  displayName: string;
};

export type PanelAppointment = {
  id: string;
  code: string;
  date: string;
  time: string;
  serviceName: string;
  customerName: string;
  phone: string;
  email: string | null;
  plate: string;
  notes: string | null;
  status: AppointmentStatus;
};

export type PanelSummary = {
  today: number;
  pending: number;
  nextSevenDays: number;
};

export type PanelView = "proximas" | "anteriores";

export type PanelFilters = {
  status: AppointmentStatus | null;
  view: PanelView;
};
