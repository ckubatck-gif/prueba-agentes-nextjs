import { addDays, getMadridNow } from "./schedule";
import { isAppointmentStatus } from "./status";
import type { PanelAppointment, PanelFilters, PanelView } from "./types";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** Lee ?estado= y ?vista= sin fiarse de lo que venga en la URL. */
export function parsePanelFilters(params: Record<string, SearchParamValue>): PanelFilters {
  const status = firstValue(params.estado);
  const view: PanelView = firstValue(params.vista) === "anteriores" ? "anteriores" : "proximas";
  return { status: isAppointmentStatus(status) ? status : null, view };
}

/** Construye la URL del panel conservando los filtros. */
export function panelHref(filters: PanelFilters): string {
  const query = new URLSearchParams();
  if (filters.status) query.set("estado", filters.status);
  if (filters.view === "anteriores") query.set("vista", "anteriores");
  const text = query.toString();
  return text ? `/panel?${text}` : "/panel";
}

/** Fechas de referencia del resumen: hoy y dentro de 7 días, en Madrid. */
export function getPanelDates(now: Date): { today: string; inSevenDays: string } {
  const today = getMadridNow(now).date;
  return { today, inSevenDays: addDays(today, 7) };
}

/** Agrupa las citas por día conservando el orden recibido. */
export function groupByDate(appointments: readonly PanelAppointment[]): { date: string; items: PanelAppointment[] }[] {
  const groups: { date: string; items: PanelAppointment[] }[] = [];
  for (const appointment of appointments) {
    const last = groups.at(-1);
    if (last && last.date === appointment.date) {
      last.items.push(appointment);
    } else {
      groups.push({ date: appointment.date, items: [appointment] });
    }
  }
  return groups;
}
