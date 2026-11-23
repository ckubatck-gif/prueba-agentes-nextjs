import { Suspense } from "react";
import { BookingSection, BookingSectionFallback } from "@/components/booking/booking-section";
import { DemoNotice } from "@/components/demo-notice";
import { LookupBox } from "@/components/lookup-box";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <DemoNotice />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <section aria-labelledby="titulo" className="flex flex-col gap-5 lg:sticky lg:top-8">
          <h1 id="titulo" className="font-display text-5xl font-bold leading-[0.95] sm:text-6xl">
            Pide cita en el taller sin llamar
          </h1>
          <p className="max-w-prose text-lg">
            Elige qué necesita tu coche, el día y una hora libre. Al terminar te damos un código para consultar si el
            taller ya ha confirmado tu cita.
          </p>
          <div className="max-w-sm rounded-md border-2 border-ink bg-paper px-4 py-3">
            <h2 className="font-display text-xl font-bold">Horario de citas</h2>
            <p>De lunes a viernes</p>
            <p className="font-display text-2xl font-bold">9:00 a 13:00 y 15:00 a 18:00</p>
          </div>
        </section>

        <section
          id="reserva"
          aria-labelledby="titulo-reserva"
          className="scroll-mt-6 rounded-lg border border-line bg-paper p-4 sm:p-6"
        >
          <h2 id="titulo-reserva" className="sr-only">
            Reserva tu cita
          </h2>
          <Suspense fallback={<BookingSectionFallback />}>
            <BookingSection />
          </Suspense>
        </section>
      </div>

      <section
        id="consultar"
        aria-labelledby="titulo-consultar"
        className="scroll-mt-6 flex flex-col gap-3 rounded-lg border border-line bg-paper p-4 sm:p-6"
      >
        <h2 id="titulo-consultar" className="font-display text-3xl font-bold">
          ¿Ya tienes cita?
        </h2>
        <p className="max-w-prose text-steel">Escribe el código que te dimos al reservar para ver su estado.</p>
        <LookupBox />
      </section>
    </div>
  );
}
