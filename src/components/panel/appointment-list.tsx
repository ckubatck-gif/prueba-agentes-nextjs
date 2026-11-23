import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateLong, formatPhone, formatPlate } from "@/lib/format";
import { groupByDate } from "@/lib/panel";
import type { PanelAppointment, PanelFilters } from "@/lib/types";
import { StatusActions } from "./status-actions";

type AppointmentListProps = { appointments: PanelAppointment[]; filters: PanelFilters };

export function AppointmentList({ appointments, filters }: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-line bg-paper p-5">
        <p className="font-semibold">No hay citas con este filtro.</p>
        {filters.status ? (
          <Link href="/panel" className="font-semibold text-workwear underline underline-offset-4">
            Ver todas las citas próximas
          </Link>
        ) : (
          <p className="text-steel">Cuando alguien reserve desde la portada, la cita aparecerá aquí.</p>
        )}
      </div>
    );
  }

  return (
    <section aria-labelledby="lista-citas" className="flex flex-col gap-6">
      <h2 id="lista-citas" className="sr-only">
        Citas
      </h2>
      {groupByDate(appointments).map((group) => (
        <div key={group.date} className="flex flex-col gap-2">
          <h3 className="font-display text-2xl font-bold first-letter:uppercase">{formatDateLong(group.date)}</h3>
          <ul className="flex flex-col gap-2">
            {group.items.map((appointment) => (
              <li key={appointment.id}>
                <AppointmentCard appointment={appointment} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function AppointmentCard({ appointment }: { appointment: PanelAppointment }) {
  return (
    <article
      aria-label={`${appointment.time}, ${appointment.serviceName}, ${appointment.customerName}`}
      className="grid gap-3 rounded-lg border border-line bg-paper p-4 md:grid-cols-[5rem_minmax(0,1fr)_auto] md:items-start"
    >
      <p className="font-display text-3xl font-bold leading-none">{appointment.time}</p>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{appointment.serviceName}</p>
          <StatusBadge status={appointment.status} />
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-sm">
          <dt className="text-steel">Cliente</dt>
          <dd className="break-words">{appointment.customerName}</dd>
          <dt className="text-steel">Teléfono</dt>
          <dd>
            <a href={`tel:+34${appointment.phone}`} className="underline underline-offset-2">
              {formatPhone(appointment.phone)}
            </a>
          </dd>
          <dt className="text-steel">Matrícula</dt>
          <dd className="font-display text-base font-bold tracking-wider">{formatPlate(appointment.plate)}</dd>
          {appointment.email ? (
            <>
              <dt className="text-steel">Email</dt>
              <dd className="break-all">{appointment.email}</dd>
            </>
          ) : null}
          {appointment.notes ? (
            <>
              <dt className="text-steel">Notas</dt>
              <dd className="whitespace-pre-line break-words">{appointment.notes}</dd>
            </>
          ) : null}
          <dt className="text-steel">Código</dt>
          <dd className="font-display tracking-wider">{appointment.code}</dd>
        </dl>
      </div>
      <StatusActions id={appointment.id} status={appointment.status} />
    </article>
  );
}
