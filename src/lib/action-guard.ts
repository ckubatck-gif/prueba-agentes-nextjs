import { unstable_rethrow } from "next/navigation";
import { GENERIC_ERROR } from "./errors";
import type { ActionResult } from "./types";

/** Nombre del error para el registro: nunca su mensaje, que podría arrastrar datos de la petición. */
function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

/**
 * Ejecuta el cuerpo de una Server Action sin dejar escapar ninguna excepción (D8.4): si Supabase no
 * responde, faltan variables de entorno o falla una lectura auxiliar, devuelve `{ ok: false }` con un
 * mensaje en español. Las excepciones internas de Next (redirect, notFound…) se relanzan con
 * `unstable_rethrow`, aunque las acciones llaman a `redirect()` fuera de este envoltorio.
 */
export async function guardAction<T>(
  context: string,
  run: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await run();
  } catch (error) {
    unstable_rethrow(error);
    console.error(`[${context}] error inesperado`, errorName(error));
    return { ok: false, error: GENERIC_ERROR };
  }
}
