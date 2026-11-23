import { describe, expect, it } from "vitest";
import {
  formatDateLong,
  formatDayMonth,
  formatPhone,
  formatPlate,
  formatPrice,
  toBookableDay,
} from "@/lib/format";

describe("format", () => {
  it("formatea fechas en español sin desplazar el día", () => {
    expect(formatDateLong("2026-11-23")).toBe("lunes, 23 de noviembre de 2026");
    expect(formatDayMonth("2026-12-01")).toBe("martes, 1 de diciembre");
  });

  it("prepara los datos de un día para el selector", () => {
    expect(toBookableDay("2026-11-27")).toEqual({
      value: "2026-11-27",
      weekday: "vie",
      day: "27",
      month: "nov",
      monthLabel: "noviembre de 2026",
      label: "viernes, 27 de noviembre",
    });
  });

  it("formatea precios en euros", () => {
    expect(formatPrice(89)).toBe("89 €");
    expect(formatPrice(120.5)).toBe("120,5 €");
  });

  it("formatea teléfono y matrícula para mostrarlos", () => {
    expect(formatPhone("612345678")).toBe("612 345 678");
    expect(formatPhone("123")).toBe("123");
    expect(formatPlate("1234BCD")).toBe("1234 BCD");
    expect(formatPlate("PO1234AB")).toBe("PO-1234-AB");
    expect(formatPlate("RARO")).toBe("RARO");
  });
});
