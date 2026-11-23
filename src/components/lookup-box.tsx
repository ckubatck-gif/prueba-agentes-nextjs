"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { TextField } from "@/components/form/text-field";
import { isValidBookingCode, normalizeBookingCode } from "@/lib/booking-code";

/** "¿Ya tienes cita?": lleva a /reserva/[codigo]. El servidor vuelve a validar el código. */
export function LookupBox() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeBookingCode(code);
    if (!isValidBookingCode(normalized)) {
      setError("El código tiene 8 caracteres, letras y números. Lo verás en la confirmación de tu reserva.");
      return;
    }
    setError(undefined);
    startTransition(() => router.push(`/reserva/${normalized}`));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <TextField
          id="lookup-code"
          name="codigo"
          label="Código de reserva"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={12}
          placeholder="K7M2XQ9P"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={error}
          className="font-display text-xl uppercase tracking-[0.12em]"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border-2 border-workwear px-5 py-2.5 font-semibold text-workwear hover:bg-workwear hover:text-paper disabled:cursor-not-allowed disabled:opacity-60 sm:mt-7"
      >
        {pending ? "Abriendo…" : "Consultar"}
      </button>
    </form>
  );
}
