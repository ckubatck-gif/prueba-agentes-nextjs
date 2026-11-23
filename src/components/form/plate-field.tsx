import type { InputHTMLAttributes } from "react";
import { FieldLabel, FieldMessages, describedBy } from "./text-field";

type PlateFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

/** Campo de matrícula con el aspecto de una placa española: franja azul con la E y letra condensada. */
export function PlateField({ id, label, hint, error, ...inputProps }: PlateFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id} label={label} />
      <div
        className={`flex w-full max-w-xs overflow-hidden rounded-md border-2 bg-paper shadow-[inset_0_0_0_2px_#fff] ${
          error ? "border-danger" : "border-ink"
        } focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-workwear`}
      >
        <span
          aria-hidden="true"
          className="flex w-9 shrink-0 flex-col items-center justify-end bg-eu pb-1.5 font-display text-lg font-bold leading-none text-paper"
        >
          <span className="mb-auto mt-1.5 size-3 rounded-full border-2 border-dotted border-signal" />E
        </span>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 font-display text-3xl font-bold uppercase tracking-[0.12em] text-ink outline-none placeholder:text-steel/40"
          {...inputProps}
        />
      </div>
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}
