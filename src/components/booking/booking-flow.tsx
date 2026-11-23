"use client";

import { useState } from "react";
import type { BookableDay, Service } from "@/lib/types";
import { BookingForm } from "./booking-form";

/** Envuelve el formulario para poder empezar una reserva nueva desde cero. */
export function BookingFlow({ services, days }: { services: Service[]; days: BookableDay[] }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <BookingForm
      key={attempt}
      services={services}
      days={days}
      onReset={() => setAttempt((value) => value + 1)}
    />
  );
}
