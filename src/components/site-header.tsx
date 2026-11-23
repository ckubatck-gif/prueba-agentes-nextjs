import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-workwear text-paper">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-10 focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-2xl font-bold leading-none tracking-wide">
          Taller Demo
        </Link>
        <nav aria-label="Principal">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
            <li>
              <Link href="/#reserva" className="underline-offset-4 hover:underline">
                Pedir cita
              </Link>
            </li>
            <li>
              <Link href="/#consultar" className="underline-offset-4 hover:underline">
                Consultar mi cita
              </Link>
            </li>
            <li>
              <Link href="/panel" className="underline-offset-4 hover:underline">
                Acceso del taller
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
