import { describe, expect, it } from "vitest";
import {
  MAX_DAYS_AHEAD,
  SLOT_TIMES,
  addDays,
  checkSlot,
  getBookableDates,
  getFreeSlots,
  getMadridNow,
  isDateInRange,
  isPastSlot,
  isSlotTime,
  isValidIsoDate,
  isWorkingDay,
  isoWeekday,
} from "@/lib/schedule";

// 2026-11-25 es miércoles. En noviembre Madrid está en UTC+1.
const WEDNESDAY_8_UTC = new Date("2026-11-25T08:00:00Z"); // 09:00 en Madrid
const WEDNESDAY_1430_UTC = new Date("2026-11-25T13:30:00Z"); // 14:30 en Madrid

describe("getMadridNow", () => {
  it("convierte la hora UTC a la de Madrid", () => {
    expect(getMadridNow(WEDNESDAY_1430_UTC)).toEqual({ date: "2026-11-25", time: "14:30" });
  });

  it("a las 23:30 UTC del domingo en Madrid ya es lunes (D5.5)", () => {
    const sunday2330Utc = new Date("2026-11-22T23:30:00Z");
    const madrid = getMadridNow(sunday2330Utc);
    expect(madrid).toEqual({ date: "2026-11-23", time: "00:30" });
    expect(isoWeekday(madrid.date)).toBe(1);
  });

  it("respeta el horario de verano (UTC+2)", () => {
    expect(getMadridNow(new Date("2026-07-15T22:15:00Z"))).toEqual({ date: "2026-07-16", time: "00:15" });
  });

  it("no depende de la zona horaria del proceso", () => {
    expect(process.env.TZ).toBe("UTC");
    expect(new Date("2026-11-22T23:30:00Z").getUTCDay()).toBe(0);
  });
});

describe("fechas", () => {
  it("valida fechas ISO reales", () => {
    expect(isValidIsoDate("2026-11-25")).toBe(true);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("25/11/2026")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });

  it("suma días cruzando meses y años", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-11-25", 60)).toBe("2027-01-24");
    expect(() => addDays("no-es-fecha", 1)).toThrow(RangeError);
  });

  it("calcula el día de la semana ISO", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-28")).toBe(6);
    expect(isoWeekday("2026-11-29")).toBe(7);
    expect(() => isoWeekday("2026-02-30")).toThrow(RangeError);
  });
});

describe("solo de lunes a viernes (D5.1)", () => {
  it("acepta laborables y rechaza fines de semana", () => {
    expect(isWorkingDay("2026-11-23")).toBe(true);
    expect(isWorkingDay("2026-11-27")).toBe(true);
    expect(isWorkingDay("2026-11-28")).toBe(false);
    expect(isWorkingDay("2026-11-29")).toBe(false);
    expect(isWorkingDay("fecha")).toBe(false);
  });

  it("checkSlot rechaza sábado y domingo con INVALID_DATE", () => {
    expect(checkSlot("2026-11-28", "10:00", WEDNESDAY_8_UTC)).toEqual({ ok: false, reason: "INVALID_DATE" });
    expect(checkSlot("2026-11-29", "10:00", WEDNESDAY_8_UTC)).toEqual({ ok: false, reason: "INVALID_DATE" });
  });
});

describe("horas de cita (D5.2)", () => {
  it("son exactamente 09, 10, 11, 12, 15, 16 y 17", () => {
    expect(SLOT_TIMES).toEqual(["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"]);
  });

  it("isSlotTime reconoce solo esas horas", () => {
    expect(isSlotTime("09:00")).toBe(true);
    expect(isSlotTime("17:00")).toBe(true);
    expect(isSlotTime("13:00")).toBe(false);
    expect(isSlotTime("14:00")).toBe(false);
    expect(isSlotTime("18:00")).toBe(false);
    expect(isSlotTime("9:00")).toBe(false);
  });

  it("checkSlot rechaza horas fuera del horario con INVALID_SLOT", () => {
    expect(checkSlot("2026-11-27", "13:00", WEDNESDAY_8_UTC)).toEqual({ ok: false, reason: "INVALID_SLOT" });
    expect(checkSlot("2026-11-27", "10:30", WEDNESDAY_8_UTC)).toEqual({ ok: false, reason: "INVALID_SLOT" });
  });
});

describe("sin horas pasadas (D5.3)", () => {
  it("una hora de hoy ya pasada no se puede reservar", () => {
    expect(isPastSlot("2026-11-25", "12:00", WEDNESDAY_1430_UTC)).toBe(true);
    expect(checkSlot("2026-11-25", "12:00", WEDNESDAY_1430_UTC)).toEqual({ ok: false, reason: "INVALID_SLOT" });
  });

  it("la hora que empieza justo ahora tampoco", () => {
    expect(isPastSlot("2026-11-25", "09:00", WEDNESDAY_8_UTC)).toBe(true);
  });

  it("una hora posterior de hoy sí", () => {
    expect(isPastSlot("2026-11-25", "15:00", WEDNESDAY_1430_UTC)).toBe(false);
    expect(checkSlot("2026-11-25", "15:00", WEDNESDAY_1430_UTC)).toEqual({ ok: true });
  });

  it("días anteriores a hoy son pasado aunque la hora sea posterior", () => {
    expect(isPastSlot("2026-11-24", "17:00", WEDNESDAY_8_UTC)).toBe(true);
    expect(checkSlot("2026-11-24", "17:00", WEDNESDAY_8_UTC)).toEqual({ ok: false, reason: "INVALID_DATE" });
  });

  it("getFreeSlots de hoy solo devuelve horas futuras", () => {
    expect(getFreeSlots("2026-11-25", [], WEDNESDAY_1430_UTC)).toEqual(["15:00", "16:00", "17:00"]);
  });

  it("a las 23:30 UTC del domingo el lunes ya es hoy y las 09:00 siguen libres", () => {
    const sunday2330Utc = new Date("2026-11-22T23:30:00Z");
    expect(getFreeSlots("2026-11-23", [], sunday2330Utc)).toEqual([...SLOT_TIMES]);
    expect(checkSlot("2026-11-22", "17:00", sunday2330Utc)).toEqual({ ok: false, reason: "INVALID_DATE" });
  });
});

describe("como máximo 60 días vista (D5.4)", () => {
  it("acepta hoy y hoy + 60, rechaza hoy + 61", () => {
    expect(MAX_DAYS_AHEAD).toBe(60);
    expect(isDateInRange("2026-11-25", WEDNESDAY_8_UTC)).toBe(true);
    expect(isDateInRange("2027-01-24", WEDNESDAY_8_UTC)).toBe(true);
    expect(isDateInRange("2027-01-25", WEDNESDAY_8_UTC)).toBe(false);
    expect(isDateInRange("2026-11-24", WEDNESDAY_8_UTC)).toBe(false);
  });

  it("checkSlot rechaza fechas más allá de 60 días", () => {
    // 2027-01-25 es lunes, pero queda a 61 días.
    expect(checkSlot("2027-01-25", "10:00", WEDNESDAY_8_UTC)).toEqual({ ok: false, reason: "INVALID_DATE" });
    expect(checkSlot("2027-01-22", "10:00", WEDNESDAY_8_UTC)).toEqual({ ok: true });
  });
});

describe("horas libres y días reservables (D5.7)", () => {
  it("quita las horas ocupadas (acepta formato HH:MM:SS)", () => {
    expect(getFreeSlots("2026-11-27", ["10:00", "16:00:00"], WEDNESDAY_8_UTC)).toEqual([
      "09:00",
      "11:00",
      "12:00",
      "15:00",
      "17:00",
    ]);
  });

  it("un fin de semana o una fecha fuera de rango no tiene horas", () => {
    expect(getFreeSlots("2026-11-28", [], WEDNESDAY_8_UTC)).toEqual([]);
    expect(getFreeSlots("2027-02-01", [], WEDNESDAY_8_UTC)).toEqual([]);
  });

  it("los días reservables son solo laborables, del rango y empiezan hoy si quedan horas", () => {
    const dates = getBookableDates(WEDNESDAY_8_UTC);
    expect(dates[0]).toBe("2026-11-25");
    expect(dates.at(-1)).toBe("2027-01-22");
    expect(dates.every(isWorkingDay)).toBe(true);
    expect(dates).not.toContain("2026-11-28");
    // 25, 26 y 27 de noviembre + 8 semanas completas hasta el viernes 22 de enero.
    expect(dates).toHaveLength(43);
  });

  it("hoy no aparece si ya han pasado todas sus horas", () => {
    const evening = new Date("2026-11-25T17:30:00Z"); // 18:30 en Madrid
    expect(getBookableDates(evening)[0]).toBe("2026-11-26");
  });
});
