import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export const inputClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2.5 text-base text-ink placeholder:text-steel/70 aria-invalid:border-danger aria-invalid:bg-danger-soft";

export function FieldLabel({ id, label, optional }: Pick<FieldShellProps, "id" | "label" | "optional">) {
  return (
    <label htmlFor={id} className="block font-semibold">
      {label}
      {optional ? <span className="font-normal text-steel"> (opcional)</span> : null}
    </label>
  );
}

export function FieldMessages({ id, hint, error }: Pick<FieldShellProps, "id" | "hint" | "error">) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-steel">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </>
  );
}

type TextFieldProps = FieldShellProps & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

export function TextField({ id, label, hint, error, optional, className, ...inputProps }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id} label={label} optional={optional} />
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass} ${className ?? ""}`}
        {...inputProps}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}

type TextAreaFieldProps = FieldShellProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id">;

export function TextAreaField({ id, label, hint, error, optional, className, ...props }: TextAreaFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel id={id} label={label} optional={optional} />
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${inputClass} min-h-24 ${className ?? ""}`}
        {...props}
      />
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  );
}
