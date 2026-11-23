import { connection } from "next/server";
import { toBookableDay } from "@/lib/format";
import { getBookableDates } from "@/lib/schedule";
import { getActiveServices } from "@/lib/supabase/queries";
import { BookingFlow } from "./booking-flow";

/** Lee los servicios de la base de datos y calcula los días reservables en el momento de la petición. */
export async function BookingSection() {
  // Supabase (y su comprobación de caducidad de la sesión) solo se ejecuta con una petición real.
  await connection();
  const services = await getActiveServices();

  if (!services || services.length === 0) {
    return (
      <p role="alert" className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-danger">
        Ahora mismo no podemos mostrar los servicios. Vuelve a intentarlo en unos minutos.
      </p>
    );
  }

  const days = getBookableDates(new Date()).map(toBookableDay);
  return <BookingFlow services={services} days={days} />;
}

export function BookingSectionFallback() {
  return (
    <p className="rounded-md border border-line bg-paper px-4 py-6 text-steel" aria-busy="true">
      Cargando servicios y días disponibles…
    </p>
  );
}
