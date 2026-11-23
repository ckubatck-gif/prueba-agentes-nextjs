import Link from "next/link";

export default function BookingNotFound() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-5 sm:p-6">
      <h1 className="font-display text-3xl font-bold">No encontramos esa cita</h1>
      <p>Revisa el código: tiene 8 caracteres, letras y números, y te lo dimos al terminar la reserva.</p>
      <Link href="/#consultar" className="self-start font-semibold text-workwear underline underline-offset-4">
        Probar con otro código
      </Link>
    </div>
  );
}
