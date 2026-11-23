import Link from "next/link";
import { panelHref } from "@/lib/panel";
import { APPOINTMENT_STATUSES, STATUS_LABELS } from "@/lib/status";
import type { PanelFilters } from "@/lib/types";

function pillClass(active: boolean): string {
  return `inline-block rounded-full border px-3 py-1 text-sm font-semibold ${
    active ? "border-workwear bg-workwear text-paper" : "border-line bg-paper text-ink hover:border-workwear"
  }`;
}

/** Filtro por estado y por periodo; vive en la URL (?estado=…&vista=…). */
export function PanelFiltersNav({ filters }: { filters: PanelFilters }) {
  const views = [
    { view: "proximas" as const, label: "Próximas" },
    { view: "anteriores" as const, label: "Anteriores" },
  ];
  const statuses = [null, ...APPOINTMENT_STATUSES];

  return (
    <nav aria-label="Filtrar citas" className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-2">
        {views.map(({ view, label }) => (
          <li key={view}>
            <Link
              href={panelHref({ ...filters, view })}
              aria-current={filters.view === view ? "page" : undefined}
              className={`inline-block border-b-4 px-1 pb-1 font-display text-xl font-bold ${
                filters.view === view ? "border-signal text-ink" : "border-transparent text-steel hover:text-ink"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-2" aria-label="Estado">
        {statuses.map((status) => (
          <li key={status ?? "todas"}>
            <Link
              href={panelHref({ ...filters, status })}
              aria-current={filters.status === status ? "page" : undefined}
              className={pillClass(filters.status === status)}
            >
              {status ? STATUS_LABELS[status] : "Todas"}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
