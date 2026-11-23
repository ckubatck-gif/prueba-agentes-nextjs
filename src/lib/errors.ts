export const GENERIC_ERROR = "No hemos podido completar la operación. Inténtalo de nuevo en unos minutos.";

const DB_ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: "Esa hora acaba de ocuparse. Elige otra, por favor.",
  TOO_MANY_BOOKINGS:
    "Este teléfono ya tiene 3 citas pendientes. Para pedir otra, espera a que pase alguna o llama al taller.",
  INVALID_SLOT: "Esa hora ya no está disponible. Elige otra, por favor.",
  INVALID_DATE: "Esa fecha no se puede reservar. Elige un día laborable de los próximos 60 días.",
  INVALID_SERVICE: "Ese servicio no está disponible ahora mismo.",
  INVALID_DATA: "Revisa los datos del formulario: alguno no es válido.",
  INVALID_TRANSITION: "Ese cambio de estado no está permitido.",
};

/** Busca un código de error de negocio (SLOT_TAKEN…) dentro del mensaje de Postgres. */
export function extractDbErrorCode(message: string | null | undefined): string | null {
  if (!message) return null;
  const match = /\b(SLOT_TAKEN|TOO_MANY_BOOKINGS|INVALID_SLOT|INVALID_DATE|INVALID_SERVICE|INVALID_DATA|INVALID_TRANSITION)\b/.exec(
    message,
  );
  return match ? match[1] : null;
}

/** Traduce un error de la base de datos a un mensaje claro en español, sin detalles internos. */
export function translateDbError(message: string | null | undefined): string {
  const code = extractDbErrorCode(message);
  return code ? DB_ERROR_MESSAGES[code] : GENERIC_ERROR;
}

/** Paso del formulario al que hay que volver según el error: la hora o el día ya no valen. */
export function errorStep(code: string | null): "time" | "date" | null {
  if (code === "SLOT_TAKEN" || code === "INVALID_SLOT") return "time";
  if (code === "INVALID_DATE") return "date";
  return null;
}

/** Traduce el error de inicio de sesión de Supabase Auth. */
export function translateAuthError(code: string | null | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Correo electrónico o contraseña incorrectos.";
    case "email_not_confirmed":
      return "Este usuario todavía no ha confirmado su correo electrónico.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    case "user_banned":
      return "Este usuario está bloqueado.";
    default:
      return "No se ha podido iniciar sesión. Revisa los datos e inténtalo de nuevo.";
  }
}
