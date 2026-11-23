"use client";

import { useActionState, useState, useTransition } from "react";
import { createBooking, getAvailability } from "@/app/actions/booking";
import type { ActionResult, BookableDay, BookingCreated, BookingDetails, Service } from "@/lib/types";
import { BookingSuccess } from "./booking-success";
import { ChoicesSummary, type Choice } from "./choices-summary";
import { DateStep } from "./date-step";
import { DetailsStep } from "./details-step";
import { ServiceStep } from "./service-step";
import { Stepper } from "./stepper";
import { STEPS, stepNumber, type Step } from "./steps";
import { TimeStep, type SlotsState } from "./time-step";

type BookingFormProps = {
  services: Service[];
  days: BookableDay[];
  onReset: () => void;
};

const EMPTY_DETAILS: BookingDetails = { name: "", phone: "", email: "", plate: "", notes: "" };

/** Reserva por pasos: servicio → día → hora libre → datos. Todo lo que importa se valida en el servidor. */
export function BookingForm({ services, days, onReset }: BookingFormProps) {
  const [step, setStep] = useState<Step>("service");
  const [serviceSlug, setServiceSlug] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotsState>({ date: null, status: "idle", slots: [] });
  const [details, setDetails] = useState<BookingDetails>(EMPTY_DETAILS);
  const [, startLoading] = useTransition();

  function loadSlots(day: string) {
    setSlots({ date: day, status: "loading", slots: [] });
    startLoading(async () => {
      const result = await getAvailability(day);
      setSlots(
        result.ok
          ? { date: day, status: "ready", slots: result.data.slots }
          : { date: day, status: "error", slots: [], error: result.error },
      );
    });
  }

  const [state, formAction, pending] = useActionState(
    async (previous: ActionResult<BookingCreated> | null, formData: FormData) => {
      const result = await createBooking(previous, formData);
      if (!result.ok && result.fieldErrors?.date) {
        setDate(null);
        setTime(null);
        setStep("date");
      } else if (!result.ok && result.fieldErrors?.time && date) {
        setTime(null);
        setStep("time");
        loadSlots(date);
      }
      return result;
    },
    null,
  );

  const service = services.find((item) => item.slug === serviceSlug) ?? null;
  const day = days.find((item) => item.value === date) ?? null;

  if (state?.ok && service && day && time) {
    return (
      <BookingSuccess
        code={state.data.code}
        summary={`${service.name}, ${day.label} a las ${time}`}
        onReset={onReset}
      />
    );
  }

  const allChoices: (Choice | null)[] = [
    service ? { step: "service", label: "Servicio", value: service.name } : null,
    day ? { step: "date", label: "Día", value: day.label } : null,
    time ? { step: "time", label: "Hora", value: time } : null,
  ];
  const choices = allChoices.filter((choice): choice is Choice => choice !== null && choice.step !== step);

  const notices = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <div className="flex flex-col gap-5">
      <Stepper current={step} />
      <p aria-live="polite" className="sr-only">
        Paso {stepNumber(step)} de {STEPS.length}: {STEPS[stepNumber(step) - 1].title}
      </p>
      <ChoicesSummary
        choices={choices}
        onEdit={(target) => {
          setStep(target);
          if (target === "time" && date && slots.date !== date) loadSlots(date);
        }}
      />

      {step === "service" ? (
        <ServiceStep
          services={services}
          selected={serviceSlug}
          onSelect={(slug) => {
            setServiceSlug(slug);
            setStep(date ? (time ? "details" : "time") : "date");
          }}
        />
      ) : null}

      {step === "date" ? (
        <DateStep
          days={days}
          selected={date}
          notice={notices.date}
          onSelect={(value) => {
            setDate(value);
            setTime(null);
            setStep("time");
            loadSlots(value);
          }}
        />
      ) : null}

      {step === "time" && day ? (
        <TimeStep
          dayLabel={day.label}
          slots={slots.date === day.value ? slots : { date: day.value, status: "loading", slots: [] }}
          selected={time}
          notice={notices.time}
          onSelect={(value) => {
            setTime(value);
            setStep("details");
          }}
          onRetry={() => loadSlots(day.value)}
          onChangeDay={() => setStep("date")}
        />
      ) : null}

      {step === "details" && service && day && time ? (
        <DetailsStep
          values={details}
          onChange={setDetails}
          choice={{ serviceSlug: service.slug, date: day.value, time }}
          state={state}
          formAction={formAction}
          pending={pending}
        />
      ) : null}
    </div>
  );
}
