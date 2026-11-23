"use client";

import Link from "next/link";

/** Errores inesperados de una página. No muestra detalles internos, solo cómo seguir. */
export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-12 sm:px-6" role="alert">
      <h1 className="font-display text-4xl font-bold">No hemos podido cargar esta página</h1>
      <p>Puede ser un fallo momentáneo de conexión con el taller. Vuelve a intentarlo en unos segundos.</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-workwear px-5 py-3 font-semibold text-paper hover:bg-workwear-dark"
        >
          Volver a intentarlo
        </button>
        <Link href="/" className="rounded-md border border-ink px-5 py-3 font-semibold hover:bg-paper">
          Ir a la portada
        </Link>
      </div>
    </div>
  );
}
