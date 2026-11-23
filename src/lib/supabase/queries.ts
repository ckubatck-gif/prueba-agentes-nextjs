import "server-only";
import type {
  BookingSummary,
  PanelAppointment,
  PanelFilters,
  PanelSummary,
  Service,
  StaffMember,
} from "@/lib/types";
import { getPanelDates } from "@/lib/panel";
import { createClient, type ServerSupabaseClient } from "./server";

const PANEL_LIMIT = 200;

/**
 * Error de lectura sin datos personales. En una página lo recoge error.tsx; en una Server Action lo
 * convierte guardAction en `{ ok: false }` (D8.4).
 */
function fail(context: string, code: string | undefined): never {
  console.error(`[supabase] ${context} falló`, code || "sin código");
  throw new Error("No se han podido cargar los datos.");
}

export async function getActiveServices(): Promise<Service[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("slug, name, duration_minutes, price_from")
    .eq("active", true)
    .order("sort_order");
  if (error) {
    console.error("[supabase] services falló", error.code);
    return null;
  }
  return data.map((row) => ({
    slug: row.slug,
    name: row.name,
    durationMinutes: row.duration_minutes,
    priceFrom: Number(row.price_from),
  }));
}

export async function getBookingByCode(code: string): Promise<BookingSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booking", { p_code: code });
  if (error) fail("get_booking", error.code);
  const row = data[0];
  if (!row) return null;
  return {
    code: row.code,
    serviceName: row.service_name,
    date: row.appointment_date,
    time: row.appointment_time,
    status: row.status,
  };
}

/**
 * Usuario de la sesión y su ficha de personal (null si no es del taller).
 * getClaims valida el JWT; la ficha se lee con RLS, que solo deja ver la propia.
 */
export async function getCurrentStaff(
  client?: ServerSupabaseClient,
): Promise<{ userId: string | null; email: string | null; staff: StaffMember | null }> {
  const supabase = client ?? (await createClient());
  const { data: auth } = await supabase.auth.getClaims();
  const userId = typeof auth?.claims?.sub === "string" ? auth.claims.sub : null;
  const email = typeof auth?.claims?.email === "string" ? auth.claims.email : null;
  if (!userId) return { userId: null, email: null, staff: null };

  const { data, error } = await supabase
    .from("staff")
    .select("user_id, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) fail("staff", error.code);
  return {
    userId,
    email,
    staff: data ? { userId: data.user_id, displayName: data.display_name } : null,
  };
}

async function countAppointments(
  supabase: ServerSupabaseClient,
  build: (query: ReturnType<typeof baseCount>) => ReturnType<typeof baseCount>,
): Promise<number> {
  const { count, error } = await build(baseCount(supabase));
  if (error) fail("appointments (recuento)", error.code);
  return count ?? 0;
}

function baseCount(supabase: ServerSupabaseClient) {
  return supabase.from("appointments").select("id", { count: "exact", head: true });
}

export async function getPanelSummary(supabase: ServerSupabaseClient, now: Date): Promise<PanelSummary> {
  const { today, inSevenDays } = getPanelDates(now);
  const active = ["pendiente", "confirmada"] as const;
  const [todayCount, pending, nextSevenDays] = await Promise.all([
    countAppointments(supabase, (q) => q.eq("appointment_date", today).in("status", active)),
    countAppointments(supabase, (q) => q.gte("appointment_date", today).eq("status", "pendiente")),
    countAppointments(supabase, (q) =>
      q.gte("appointment_date", today).lt("appointment_date", inSevenDays).in("status", active),
    ),
  ]);
  return { today: todayCount, pending, nextSevenDays };
}

export async function getPanelAppointments(
  supabase: ServerSupabaseClient,
  filters: PanelFilters,
  now: Date,
): Promise<PanelAppointment[]> {
  const { today } = getPanelDates(now);
  const upcoming = filters.view === "proximas";
  let query = supabase
    .from("appointments")
    .select("id, code, appointment_date, appointment_time, customer_name, phone, email, plate, notes, status, services(name)")
    .order("appointment_date", { ascending: upcoming })
    .order("appointment_time", { ascending: true })
    .limit(PANEL_LIMIT);
  query = upcoming ? query.gte("appointment_date", today) : query.lt("appointment_date", today);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) fail("appointments", error.code);
  return data.map((row) => ({
    id: row.id,
    code: row.code,
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5),
    serviceName: row.services?.name ?? "Servicio",
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    plate: row.plate,
    notes: row.notes,
    status: row.status,
  }));
}
