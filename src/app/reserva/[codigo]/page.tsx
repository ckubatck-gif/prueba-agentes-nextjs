import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { StatusBadge } from "@/components/status-badge";
import { isValidBookingCode, normalizeBookingCode } from "@/lib/booking-code";
import { formatDateLong } from "@/lib/format";
import { getBookingByCode } from "@/lib/supabase/queries";
import type { AppointmentStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tu cita",
  robots: { index: false, follow: false },
};

type BookingPageProps = { params: Promise<{ codigo: string }> };

const STATUS_HELP: Record<AppointmentStatus, string> = {
  pendiente: "El taller todavía no la ha confirmado. Vuelve a mirar más tarde.",
  confirmada: "El taller te espera ese día a esa hora. Trae el coche unos minutos antes.",
  completada: "El trabajo ya está hecho. Gracias por venir.",
  cancelada: "Esta cita se ha cancelado. Si la necesitas, pide una nueva.",
};

export default function BookingPage({ params }: BookingPageProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<p className="text-steel">Buscando tu cita…</p>}>
        <BookingDetails params={params} />
      </Suspense>
      <Link href="/" className="self-start font-semibold text-workwear underline underline-offset-4">
        Volver a la portada
      </Link>
    </div>
  );
}

async function BookingDetails({ params }: BookingPageProps) {
  await connection();
  const { codigo } = await params;
  const code = normalizeBookingCode(codigo);
  if (!isValidBookingCode(code)) notFound();

  const booking = await getBookingByCode(code);
  if (!booking) notFound();

  return (
    <article aria-labelledby="titulo-cita" className="flex flex-col gap-4 rounded-lg border border-line bg-paper p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="titulo-cita" className="font-display text-4xl font-bold">
            Tu cita
          </h1>
          <p className="text-steel">
            Código <span className="font-display text-xl font-bold tracking-[0.14em] text-ink">{booking.code}</span>
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>
      <dl className="grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="text-steel">Servicio</dt>
        <dd className="font-semibold">{booking.serviceName}</dd>
        <dt className="text-steel">Día</dt>
        <dd className="font-semibold first-letter:uppercase">{formatDateLong(booking.date)}</dd>
        <dt className="text-steel">Hora</dt>
        <dd className="font-display text-2xl font-bold">{booking.time}</dd>
      </dl>
      <p className="border-t border-line pt-4">{STATUS_HELP[booking.status]}</p>
    </article>
  );
}
