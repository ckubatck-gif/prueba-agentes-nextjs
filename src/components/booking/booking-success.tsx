import Link from "next/link";

type BookingSuccessProps = {
  code: string;
  summary: string;
  onReset: () => void;
};

/** Resguardo de la reserva: el código es lo que el cliente necesita guardar (D7.6). */
export function BookingSuccess({ code, summary, onReset }: BookingSuccessProps) {
  return (
    <section aria-labelledby="reserva-hecha" className="flex flex-col gap-4" role="status">
      <h3 id="reserva-hecha" className="font-display text-3xl font-bold">
        Cita reservada
      </h3>
      <p className="first-letter:uppercase">{summary}. La verás como pendiente hasta que el taller la confirme.</p>
      <div className="rounded-md border-2 border-dashed border-ink bg-paper px-5 py-4">
        <p className="text-sm text-steel">Tu código de reserva</p>
        <p className="font-display text-4xl font-bold tracking-[0.18em] break-all sm:text-5xl">{code}</p>
        <p className="mt-1 text-sm text-steel">Guárdalo: con él puedes consultar el estado de tu cita.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/reserva/${code}`}
          className="rounded-md bg-workwear px-5 py-3 font-semibold text-paper hover:bg-workwear-dark"
        >
          Ver mi cita
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-ink px-5 py-3 font-semibold hover:bg-concrete"
        >
          Pedir otra cita
        </button>
      </div>
    </section>
  );
}
