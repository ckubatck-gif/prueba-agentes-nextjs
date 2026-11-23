"use client";

import { useActionState, type MouseEvent } from "react";
import { updateStatus } from "@/app/actions/panel";
import { STATUS_ACTION_LABELS, allowedTransitions } from "@/lib/status";
import type { AppointmentStatus } from "@/lib/types";

function confirmCancel(event: MouseEvent<HTMLButtonElement>) {
  if (!window.confirm("¿Seguro que quieres cancelar esta cita? Se liberará la hora.")) event.preventDefault();
}

/** Botones de cambio de estado permitidos para la cita. Solo se envía el estado nuevo, nunca datos del cliente. */
export function StatusActions({ id, status }: { id: string; status: AppointmentStatus }) {
  const [state, formAction, pending] = useActionState(updateStatus, null);
  const targets = allowedTransitions(status).filter(
    (target): target is Exclude<AppointmentStatus, "pendiente"> => target !== "pendiente",
  );
  if (targets.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-2 md:items-end" aria-busy={pending}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap gap-2">
        {targets.map((target) => (
          <button
            key={target}
            type="submit"
            name="status"
            value={target}
            disabled={pending}
            onClick={target === "cancelada" ? confirmCancel : undefined}
            className={`rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              target === "cancelada"
                ? "border border-danger text-danger hover:bg-danger-soft"
                : "bg-workwear text-paper hover:bg-workwear-dark"
            }`}
          >
            {STATUS_ACTION_LABELS[target]}
          </button>
        ))}
      </div>
      {pending ? <p className="text-sm text-steel">Guardando…</p> : null}
      {state && !state.ok ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
