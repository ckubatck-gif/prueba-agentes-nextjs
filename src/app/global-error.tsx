"use client";

import "./globals.css";

/** Último recurso si falla el propio layout: define su propio <html lang="es">. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="es">
      <body className="flex min-h-dvh items-center justify-center bg-concrete px-4 text-ink">
        <title>Error | Taller Demo</title>
        <div className="flex max-w-md flex-col gap-4" role="alert">
          <h1 className="text-3xl font-bold">La web del taller no responde</h1>
          <p>Ha ocurrido un error inesperado. Vuelve a intentarlo en unos segundos.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="self-start rounded-md bg-workwear px-5 py-3 font-semibold text-paper"
          >
            Volver a intentarlo
          </button>
        </div>
      </body>
    </html>
  );
}
