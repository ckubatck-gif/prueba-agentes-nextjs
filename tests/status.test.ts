import { describe, expect, it } from "vitest";
import {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
  allowedTransitions,
  canTransition,
  isActiveStatus,
  isAppointmentStatus,
} from "@/lib/status";

describe("estados de la cita", () => {
  it("conoce los cuatro estados y sus etiquetas", () => {
    expect(APPOINTMENT_STATUSES).toEqual(["pendiente", "confirmada", "completada", "cancelada"]);
    expect(STATUS_LABELS.confirmada).toBe("Confirmada");
    expect(isAppointmentStatus("pendiente")).toBe(true);
    expect(isAppointmentStatus("borrada")).toBe(false);
  });

  it("pendiente → confirmada → completada; cancelar desde cualquiera salvo completada", () => {
    expect(allowedTransitions("pendiente")).toEqual(["confirmada", "cancelada"]);
    expect(allowedTransitions("confirmada")).toEqual(["completada", "cancelada"]);
    expect(allowedTransitions("completada")).toEqual([]);
    expect(allowedTransitions("cancelada")).toEqual([]);
    expect(canTransition("pendiente", "completada")).toBe(false);
    expect(canTransition("completada", "cancelada")).toBe(false);
    expect(canTransition("confirmada", "pendiente")).toBe(false);
    expect(canTransition("pendiente", "cancelada")).toBe(true);
  });

  it("solo pendiente y confirmada ocupan hueco", () => {
    expect(isActiveStatus("pendiente")).toBe(true);
    expect(isActiveStatus("confirmada")).toBe(true);
    expect(isActiveStatus("completada")).toBe(false);
    expect(isActiveStatus("cancelada")).toBe(false);
  });
});
