import { STEPS, stepNumber, type Step } from "./steps";

/** Pasos de la reserva: es una secuencia real, por eso va numerada. */
export function Stepper({ current }: { current: Step }) {
  const currentNumber = stepNumber(current);
  return (
    <ol className="grid grid-cols-4 gap-1 text-sm" aria-label="Pasos de la reserva">
      {STEPS.map((step, index) => {
        const number = index + 1;
        const state = number < currentNumber ? "done" : number === currentNumber ? "current" : "todo";
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={`flex flex-col gap-1 border-t-4 pt-2 ${
              state === "current" ? "border-signal text-ink" : state === "done" ? "border-workwear text-ink" : "border-line text-steel"
            }`}
          >
            <span className="font-display text-lg font-bold leading-none">{number}</span>
            <span className={state === "current" ? "font-semibold" : undefined}>{step.title}</span>
          </li>
        );
      })}
    </ol>
  );
}
