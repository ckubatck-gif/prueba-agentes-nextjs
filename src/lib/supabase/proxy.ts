import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseEnv } from "./env";

function getRedirectPath(signedIn: boolean, pathname: string): string | null {
  const isPanel = pathname === "/panel" || pathname.startsWith("/panel/");
  if (!signedIn && isPanel) return "/login";
  if (signedIn && pathname === "/login") return "/panel";
  return null;
}

/**
 * Refresca la sesión de Supabase en cada petición y protege /panel.
 * La comprobación de que el usuario es personal del taller se repite en el servidor (panel y acciones).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const extraHeaders: Record<string, string> = {};
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) {
          extraHeaders[key] = value;
          response.headers.set(key, value);
        }
      },
    },
  });

  // getClaims valida el JWT (y lo refresca si ha caducado). Nada de lógica entre crear el cliente y esto.
  const { data } = await supabase.auth.getClaims();
  const signedIn = typeof data?.claims?.sub === "string";
  const redirectTo = getRedirectPath(signedIn, request.nextUrl.pathname);
  if (!redirectTo) return response;

  const target = request.nextUrl.clone();
  target.pathname = redirectTo;
  target.search = "";
  const redirect = NextResponse.redirect(target);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const [key, value] of Object.entries(extraHeaders)) redirect.headers.set(key, value);
  return redirect;
}
