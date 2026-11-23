import { ChoiceButton } from "./choice-button";

export type SlotsState = {
  date: string | null;
  status: "idle" | "loading" | "ready" | "error";
  slots: string[];
  error?: string;
};

type TimeStepProps = {
  dayLabel: string;
  slots: SlotsState;
  selected: string | null;
  notice?: string;
  onSelect: (time: string) => void;
  onRetry: () => void;
  onChangeDay: () => void;
};

const SHIFTS = [
  { title: "Mañana", test: (slot: string) => slot < "13:00" },
  { title: "Tarde", test: (slot: string) => slot >= "13:00" },
];

/** Solo se ofrecen las horas libres que devuelve el servidor para ese día. */
export function TimeStep({ dayLabel, slots, selected, notice, onSelect, onRetry, onChangeDay }: TimeStepProps) {
  return (
    <section aria-labelledby="paso-hora" className="flex flex-col gap-3" aria-busy={slots.status === "loading"}>
      <h3 id="paso-hora" className="font-display text-2xl font-bold">
        Elige la hora
      </h3>
      <p className="text-sm text-steel first-letter:uppercase">{dayLabel}. Cada cita dura una hora.</p>
      {notice ? (
        <p role="alert" className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {notice}
        </p>
      ) : null}

      {slots.status === "loading" ? <p className="text-steel">Buscando horas libres…</p> : null}

      {slots.status === "error" ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-danger">
          <p>{slots.error}</p>
          <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-4">
            Volver a intentarlo
          </button>
        </div>
      ) : null}

      {slots.status === "ready" && slots.slots.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p>Ese día ya no quedan horas libres.</p>
          <button type="button" onClick={onChangeDay} className="font-semibold text-workwear underline underline-offset-4">
            Elegir otro día
          </button>
        </div>
      ) : null}

      {slots.status === "ready" && slots.slots.length > 0
        ? SHIFTS.map((shift) => {
            const shiftSlots = slots.slots.filter(shift.test);
            if (shiftSlots.length === 0) return null;
            return (
              <div key={shift.title} className="flex flex-col gap-2">
                <h4 className="font-semibold">{shift.title}</h4>
                <ul className="flex flex-wrap gap-2">
                  {shiftSlots.map((slot) => (
                    <li key={slot}>
                      <ChoiceButton
                        selected={slot === selected}
                        onClick={() => onSelect(slot)}
                        className="px-4 py-2 font-display text-xl font-bold"
                      >
                        {slot}
                      </ChoiceButton>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        : null}
    </section>
  );
}
