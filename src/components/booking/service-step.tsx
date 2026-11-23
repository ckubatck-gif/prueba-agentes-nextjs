import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { ChoiceButton } from "./choice-button";

type ServiceStepProps = {
  services: Service[];
  selected: string | null;
  onSelect: (slug: string) => void;
};

export function ServiceStep({ services, selected, onSelect }: ServiceStepProps) {
  return (
    <section aria-labelledby="paso-servicio" className="flex flex-col gap-3">
      <h3 id="paso-servicio" className="font-display text-2xl font-bold">
        ¿Qué necesita tu coche?
      </h3>
      <p className="text-sm text-steel">Los precios son orientativos: el presupuesto final te lo damos en el taller.</p>
      <ul className="flex flex-col gap-2">
        {services.map((service) => {
          const isSelected = service.slug === selected;
          return (
            <li key={service.slug}>
              <ChoiceButton
                selected={isSelected}
                onClick={() => onSelect(service.slug)}
                className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3"
              >
                <span className="font-semibold">{service.name}</span>
                <span className={`text-sm ${isSelected ? "text-paper" : "text-steel"}`}>
                  desde <strong className="font-semibold">{formatPrice(service.priceFrom)}</strong>, unos{" "}
                  {service.durationMinutes} min
                </span>
              </ChoiceButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
