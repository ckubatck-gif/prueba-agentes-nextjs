import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppointmentList } from "@/components/panel/appointment-list";
import { NoAccess } from "@/components/panel/no-access";
import { PanelFiltersNav } from "@/components/panel/panel-filters";
import { PanelSummaryView } from "@/components/panel/panel-summary";
import { parsePanelFilters } from "@/lib/panel";
import { getCurrentStaff, getPanelAppointments, getPanelSummary } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel del taller",
  robots: { index: false, follow: false },
};

type PanelPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function PanelPage({ searchParams }: PanelPageProps) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Suspense fallback={<p className="text-steel">Cargando el panel…</p>}>
        <PanelContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PanelContent({ searchParams }: PanelPageProps) {
  // Datos de la sesión y "hoy": solo con una petición real, nunca en un prerender.
  await connection();
  const supabase = await createClient();

  // Comprobación en el servidor (D6.3): sin sesión fuera; con sesión pero sin ficha en `staff`, sin datos.
  const { userId, email, staff } = await getCurrentStaff(supabase);
  if (!userId) redirect("/login");
  if (!staff) return <NoAccess email={email} />;

  const filters = parsePanelFilters(await searchParams);
  const now = new Date();
  const [summary, appointments] = await Promise.all([
    getPanelSummary(supabase, now),
    getPanelAppointments(supabase, filters, now),
  ]);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Panel del taller</h1>
          <p className="text-steel">Hola, {staff.displayName}. Estas son las citas de Taller Demo.</p>
        </div>
        <SignOutButton tone="dark" />
      </header>
      <PanelSummaryView summary={summary} />
      <PanelFiltersNav filters={filters} />
      <AppointmentList appointments={appointments} filters={filters} />
    </>
  );
}
