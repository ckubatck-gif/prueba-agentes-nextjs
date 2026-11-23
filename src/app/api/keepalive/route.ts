import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

function isAuthorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Ping diario del cron de Vercel para que el proyecto gratuito de Supabase no se pause. */
export async function GET(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const supabase = await createClient();
  const { count, error } = await supabase.from("services").select("slug", { count: "exact", head: true });
  if (error) {
    console.error("[keepalive] consulta a services falló", error.code);
    return Response.json({ ok: false, error: "Supabase no responde" }, { status: 503 });
  }

  return Response.json({ ok: true, services: count ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}
