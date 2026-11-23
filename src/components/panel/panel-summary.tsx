import type { PanelSummary } from "@/lib/types";

const ITEMS: { key: keyof PanelSummary; label: string; help: string }[] = [
  { key: "today", label: "Hoy", help: "citas pendientes o confirmadas" },
  { key: "pending", label: "Por confirmar", help: "citas pendientes desde hoy" },
  { key: "nextSevenDays", label: "Próximos 7 días", help: "citas activas, hoy incluido" },
];

export function PanelSummaryView({ summary }: { summary: PanelSummary }) {
  return (
    <section aria-labelledby="resumen">
      <h2 id="resumen" className="sr-only">
        Resumen
      </h2>
      <dl className="grid gap-3 sm:grid-cols-3">
        {ITEMS.map((item) => (
          <div key={item.key} className="flex flex-col rounded-lg border border-line bg-paper px-4 py-3">
            <dt className="font-semibold">{item.label}</dt>
            <dd className="font-display text-4xl font-bold leading-tight">{summary[item.key]}</dd>
            <dd className="text-sm text-steel">{item.help}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
