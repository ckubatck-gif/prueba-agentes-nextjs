import type { Step } from "./steps";

export type Choice = { step: Step; label: string; value: string };

/** Lo elegido hasta ahora, con un botón para cambiar cada cosa. */
export function ChoicesSummary({ choices, onEdit }: { choices: Choice[]; onEdit: (step: Step) => void }) {
  if (choices.length === 0) return null;
  return (
    <dl className="flex flex-col divide-y divide-line rounded-md border border-line bg-concrete/60 text-sm">
      {choices.map((choice) => (
        <div key={choice.step} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-3 py-2">
          <dt className="text-steel">{choice.label}</dt>
          <dd className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 font-semibold">
            <span className="first-letter:uppercase">{choice.value}</span>
            <button
              type="button"
              onClick={() => onEdit(choice.step)}
              className="font-medium text-workwear underline underline-offset-4"
            >
              Cambiar<span className="sr-only"> {choice.label.toLowerCase()}</span>
            </button>
          </dd>
        </div>
      ))}
    </dl>
  );
}
