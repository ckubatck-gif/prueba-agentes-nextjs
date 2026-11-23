import { PlateField } from "@/components/form/plate-field";
import { TextAreaField, TextField } from "@/components/form/text-field";
import type { ActionResult, BookingCreated, BookingDetails } from "@/lib/types";

type DetailsStepProps = {
  values: BookingDetails;
  onChange: (values: BookingDetails) => void;
  choice: { serviceSlug: string; date: string; time: string };
  state: ActionResult<BookingCreated> | null;
  formAction: (formData: FormData) => void;
  pending: boolean;
};

/** Último paso: datos del cliente. Los campos son controlados para no perder lo escrito si hay errores. */
export function DetailsStep({ values, onChange, choice, state, formAction, pending }: DetailsStepProps) {
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const formError = state && !state.ok && !errors.time && !errors.date ? state.error : undefined;
  const set = (key: keyof BookingDetails) => (event: { target: { value: string } }) =>
    onChange({ ...values, [key]: event.target.value });

  return (
    <section aria-labelledby="paso-datos" className="flex flex-col gap-3">
      <h3 id="paso-datos" className="font-display text-2xl font-bold">
        Tus datos
      </h3>
      <p className="text-sm text-steel">Solo los usa el taller para atender tu cita. Recuerda: es una demo, invéntatelos.</p>

      <form action={formAction} className="flex flex-col gap-4" noValidate aria-busy={pending}>
        <input type="hidden" name="serviceSlug" value={choice.serviceSlug} />
        <input type="hidden" name="date" value={choice.date} />
        <input type="hidden" name="time" value={choice.time} />

        {formError ? (
          <p role="alert" className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-danger">
            {formError}
          </p>
        ) : null}

        <TextField
          id="booking-name"
          name="name"
          label="Nombre"
          autoComplete="name"
          required
          maxLength={80}
          value={values.name}
          onChange={set("name")}
          error={errors.name}
        />
        <TextField
          id="booking-phone"
          name="phone"
          label="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="600 000 000"
          hint="Móvil o fijo español. Puedes poner +34."
          value={values.phone}
          onChange={set("phone")}
          error={errors.phone}
        />
        <TextField
          id="booking-email"
          name="email"
          label="Correo electrónico"
          optional
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          value={values.email}
          onChange={set("email")}
          error={errors.email}
        />
        <PlateField
          id="booking-plate"
          name="plate"
          label="Matrícula"
          required
          maxLength={12}
          placeholder="0000 BBB"
          hint="Actual (1234 BCD) o provincial (PO-1234-AB)."
          value={values.plate}
          onChange={set("plate")}
          error={errors.plate}
        />
        <TextAreaField
          id="booking-notes"
          name="notes"
          label="¿Algo que debamos saber?"
          optional
          maxLength={500}
          rows={3}
          hint={`${Array.from(values.notes).length} de 500 caracteres.`}
          value={values.notes}
          onChange={set("notes")}
          error={errors.notes}
        />

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-workwear px-6 py-3 text-lg font-semibold text-paper hover:bg-workwear-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Reservando…" : "Reservar cita"}
        </button>
      </form>
    </section>
  );
}
