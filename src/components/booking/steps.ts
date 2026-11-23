export type Step = "service" | "date" | "time" | "details";

export const STEPS: readonly { id: Step; title: string }[] = [
  { id: "service", title: "Servicio" },
  { id: "date", title: "Día" },
  { id: "time", title: "Hora" },
  { id: "details", title: "Tus datos" },
];

export function stepNumber(step: Step): number {
  return STEPS.findIndex((item) => item.id === step) + 1;
}
