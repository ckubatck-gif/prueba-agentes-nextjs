import type { ButtonHTMLAttributes } from "react";

type ChoiceButtonProps = { selected: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

/** Botón de elección (servicio, día u hora). La opción elegida lleva la marca amarilla de señalización. */
export function ChoiceButton({ selected, className, children, ...props }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`rounded-md border text-left transition-colors ${
        selected
          ? "border-workwear bg-workwear text-paper shadow-[inset_0_-4px_0_var(--color-signal)]"
          : "border-line bg-paper text-ink hover:border-workwear"
      } ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
