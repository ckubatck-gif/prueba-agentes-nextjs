import type { BookableDay } from "@/lib/types";
import { ChoiceButton } from "./choice-button";

type DateStepProps = {
  days: BookableDay[];
  selected: string | null;
  notice?: string;
  onSelect: (date: string) => void;
};

function groupByMonth(days: BookableDay[]): { month: string; days: BookableDay[] }[] {
  const groups: { month: string; days: BookableDay[] }[] = [];
  for (const day of days) {
    const last = groups.at(-1);
    if (last && last.month === day.monthLabel) last.days.push(day);
    else groups.push({ month: day.monthLabel, days: [day] });
  }
  return groups;
}

/** Solo días laborables de los próximos 60 días (calculados en el servidor, horario de Madrid). */
export function DateStep({ days, selected, notice, onSelect }: DateStepProps) {
  return (
    <section aria-labelledby="paso-dia" className="flex flex-col gap-3">
      <h3 id="paso-dia" className="font-display text-2xl font-bold">
        Elige el día
      </h3>
      <p className="text-sm text-steel">Abrimos de lunes a viernes. Puedes reservar hasta 60 días vista.</p>
      {notice ? (
        <p role="alert" className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm text-danger">
          {notice}
        </p>
      ) : null}
      {groupByMonth(days).map((group) => (
        <div key={group.month} className="flex flex-col gap-2">
          <h4 className="font-semibold first-letter:uppercase">{group.month}</h4>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-2">
            {group.days.map((day) => (
              <li key={day.value}>
                <ChoiceButton
                  selected={day.value === selected}
                  onClick={() => onSelect(day.value)}
                  aria-label={day.label}
                  className="flex w-full flex-col items-center px-1 py-2"
                >
                  <span className="text-sm">{day.weekday}</span>
                  <span className="font-display text-2xl font-bold leading-tight">{day.day}</span>
                </ChoiceButton>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
