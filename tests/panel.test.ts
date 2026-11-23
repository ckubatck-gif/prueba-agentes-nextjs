import { describe, expect, it } from "vitest";
import { getPanelDates, groupByDate, panelHref, parsePanelFilters } from "@/lib/panel";
import type { PanelAppointment } from "@/lib/types";

function appointment(id: string, date: string, time: string): PanelAppointment {
  return {
    id,
    code: "K7M2XQ9P",
    date,
    time,
    serviceName: "Revisión pre-ITV",
    customerName: "Cliente",
    phone: "612345678",
    email: null,
    plate: "1234BCD",
    notes: null,
    status: "pendiente",
  };
}

describe("filtros del panel", () => {
  it("lee estado y vista de la URL e ignora valores desconocidos", () => {
    expect(parsePanelFilters({ estado: "pendiente" })).toEqual({ status: "pendiente", view: "proximas" });
    expect(parsePanelFilters({ estado: "borrada", vista: "anteriores" })).toEqual({ status: null, view: "anteriores" });
    expect(parsePanelFilters({ estado: ["confirmada", "pendiente"], vista: "x" })).toEqual({
      status: "confirmada",
      view: "proximas",
    });
    expect(parsePanelFilters({})).toEqual({ status: null, view: "proximas" });
  });

  it("construye la URL conservando los filtros", () => {
    expect(panelHref({ status: null, view: "proximas" })).toBe("/panel");
    expect(panelHref({ status: "cancelada", view: "anteriores" })).toBe("/panel?estado=cancelada&vista=anteriores");
  });

  it("calcula hoy y dentro de 7 días en Madrid", () => {
    expect(getPanelDates(new Date("2026-11-22T23:30:00Z"))).toEqual({ today: "2026-11-23", inSevenDays: "2026-11-30" });
  });

  it("agrupa por día en el orden recibido", () => {
    const groups = groupByDate([
      appointment("1", "2026-11-25", "09:00"),
      appointment("2", "2026-11-25", "10:00"),
      appointment("3", "2026-11-26", "09:00"),
    ]);
    expect(groups.map((group) => [group.date, group.items.length])).toEqual([
      ["2026-11-25", 2],
      ["2026-11-26", 1],
    ]);
    expect(groupByDate([])).toEqual([]);
  });
});
