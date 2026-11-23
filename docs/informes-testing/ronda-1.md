# Informe Testing — Ronda 1
VEREDICTO: APROBADO

> Informe devuelto por el subagente Testing y guardado sin cambios por el Orquestador.

Alcance: D1–D9, D11 y la parte local de D10.4, como pidió el Orquestador. D10.1–D10.3 y D10.5 no se revisan en esta ronda porque aún no hay despliegue. Todos los comandos ejecutados por Testing en el repositorio y las consultas SQL lanzadas con MCP sobre `udanowdiqvymughhxglm`.

| ID | Directriz | Resultado | Evidencia |
| --- | --- | --- | --- |
| D1.1 | lint sin errores | ✅ | `npm run lint` → exit 0, ninguna salida (0 errores y 0 avisos) |
| D1.2 | tsc sin errores | ✅ | `npx tsc --noEmit` → exit 0 |
| D1.3 | tests pasan y son ≥ 20 | ✅ | `npm test` → `Test Files 6 passed (6)`, `Tests 83 passed (83)` |
| D1.4 | build con variables ficticias y sin red | ✅ | `NEXT_PUBLIC_SUPABASE_URL=https://ficticio.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ficticia_publishable CRON_SECRET=ficticio npm run build` → exit 0. Rutas: `/`, `/panel` y `/reserva/[codigo]` en ◐ (Partial Prerender); `/api/keepalive` en ƒ |
| D2.1 | solo `.env.example` en git | ✅ | `git ls-files \| grep -E '(^\|/)\.env'` → vacío. Con los no rastreados pero no ignorados → solo `.env.example`. `git check-ignore -v .env.local` → `.gitignore:34:.env*` |
| D2.2 | `.env.example` sin valores | ✅ | `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` y `CRON_SECRET=`, vacíos, más comentarios |
| D2.3 | ninguna clave en archivos rastreados | ✅ | Comando de la directriz → 0 coincidencias. Sobre rastreados + no rastreados → solo texto explicativo en `.claude/agents/develop.md:77` y `docs/DIRECTRICES.md:26-27`. Ningún patrón `eyJ…`, `sk_live` ni `BEGIN` |
| D2.4 | sin service_role/secret en src | ✅ | `grep -rn "SERVICE_ROLE\|SECRET_KEY" src` → vacío. Único secreto usado: `CRON_SECRET` (`api/keepalive/route.ts:5`) |
| D3.1 | RLS en todas las tablas de public | ✅ | Consulta de la directriz → 0 filas. `list_tables`: services, staff y appointments con `rls_enabled: true` |
| D3.2 | anon no lee citas | ✅ | `begin; set local role anon; select count(*) from public.appointments; rollback;` → `ERROR 42501: permission denied for table appointments` |
| D3.3 | anon no inserta/modifica/borra | ✅ | Como anon, insert → 42501 y update → 42501. `has_table_privilege('anon','public.appointments', INSERT/UPDATE/DELETE/TRUNCATE)` → false las 4. `pg_policies` de appointments con cmd DELETE/ALL → 0 |
| D3.4 | autenticado no-personal no ve citas | ✅ | Con 8 citas de prueba, `authenticated` con `sub` que no está en staff → ve 0, update modifica 0, `is_staff()`=false, ve 0 filas de staff, insert → 42501 |
| D3.5 | personal solo cambia el estado | ✅ | Con claims del usuario del personal: ve 8 citas, `is_staff()`=true, `update set status='confirmada'` → 1 fila. Cambiar phone, customer_name, email, plate, notes, appointment_date, appointment_time, service_id, code o status+phone → `42501` en todos. `column_privileges` → solo `UPDATE:status` |
| D3.6 | sin doble reserva salvo canceladas | ✅ | Índice `appointments_slot_unique … WHERE status <> 'cancelada'`. Mismo hueco por `book_appointment` → `SLOT_TAKEN`; insert directo → `23505`; tras cancelar, el hueco se puede volver a reservar |
| D3.7 | security definer con search_path '' y sin execute para public | ✅ | `prosecdef=true` y `proconfig={search_path=""}` en las 4 funciones. `has_function_privilege('public',oid,'EXECUTE')` → false en las 5 |
| D3.8 | advisors sin ERROR | ✅ | 0 ERROR. WARN: 3 `anon_security_definer_function_executable`, 4 `authenticated_security_definer_function_executable`, 1 `auth_leaked_password_protection` |
| D3.9 | funciones públicas sin datos personales | ✅ | `get_booking` → `(code, service_name, appointment_date, appointment_time, status)`; `taken_slots` → `(slot text)` |
| D3.10 | migraciones versionadas = aplicadas | ✅ | `list_migrations` → `20261123203616 0001_init`; md5 en BD = md5 del archivo |
| D4.1 | zod antes de Supabase | ✅ | `actions/booking.ts:35-47` valida y sale; `createClient()` en :53 |
| D4.2 | teléfono | ✅ | 8 válidos y 7 rechazados en tests; en BD `'0034 699 111 222'` → `699111222`; inválidos → `INVALID_DATA`/`23514` |
| D4.3 | matrícula | ✅ | `po-1234-ab` → `PO1234AB`; `1234AEI`, `1234BCQ`, `1234BCÑ`, `XX-1234-AB`, `123BCD` → `INVALID_DATA` |
| D4.4 | nombre, email y comentario | ✅ | Límites 2/80, email normalizado a minúsculas, notas 500 aceptadas y 501 rechazadas |
| D4.5 | SQL repite el horario | ✅ | Sábado/domingo/pasado/hoy+61 → `INVALID_DATE`; 08:00, 10:30, 13:00, 18:00 → `INVALID_SLOT`; servicio inexistente → `INVALID_SERVICE`. `supabase/tests/rls.sql` → 28/28 |
| D5.1–D5.5 | horario, horas pasadas, 60 días, Madrid | ✅ | `tests/schedule.test.ts` (incluido `2026-11-22T23:30:00Z` → lunes 00:30 en Madrid, con `TZ=UTC`) |
| D5.6 | máximo 3 citas por teléfono | ✅ | 4.ª reserva con el mismo teléfono en tres formatos → `TOO_MANY_BOOKINGS`; al cancelar una, se acepta |
| D5.7 | solo horas libres de días laborables | ✅ | `getBookableDates` + `taken_slots` + `getFreeSlots` |
| D6.1 | /panel sin sesión → /login | ✅ | `next start` + `curl -sI /panel` → `307`, `location: /login` |
| D6.2 | login con Supabase Auth y error en español | ✅ | `signInWithPassword` + `translateAuthError`. Login real pendiente de D10.5 (sin red) |
| D6.3 | el panel comprueba staff en el servidor | ✅ | `panel/page.tsx:37-39` y `actions/panel.ts:26-27` |
| D6.4 | cerrar sesión | ✅ | `sign-out-button.tsx` → `signOut` |
| D6.5 | `src/proxy.ts` y sin middleware.ts | ✅ | Existe `src/proxy.ts`; ningún `middleware.*` |
| D7.1–D7.7 | interfaz y accesibilidad | ✅ | `lang="es"`, labels, `aria-describedby`, `role="alert"`, `disabled={pending}`, sin anchos fijos > 320 px, código de reserva, aviso de demo |
| D8.1–D8.6 | calidad de código | ✅ | Sin `any`/`@ts-ignore`/`console.log`; `server-only`; `ActionResult<T>`; archivo más largo 166 líneas |
| D9.1–D9.3 | Next.js 16 | ✅ | `await cookies()/params/searchParams`; `await connection()` en Suspense; `not-found.tsx`, `error.tsx`, `global-error.tsx` |
| D10.4 (local) | cron y 401 | ✅ | `vercel.json` diario; sin cabecera / token malo → 401; token correcto → 503 (solo por falta de red); `timingSafeEqual` |
| D11.1–D11.3 | documentación | ✅ | README completo; `.env.example` con las 3 variables que usa el código |

## Fallos que Develop tiene que corregir
Ninguno.

## Observaciones (no bloquean)
1. [D3.8] Aviso WARN `auth_leaked_password_protection` (protección contra contraseñas filtradas desactivada). No es de código: se activa en Supabase › Authentication.
2. [D3.10] El archivo se llama `0001_init.sql` y la versión aplicada es `20261123203616`; la CLI de Supabase los tomaría por migraciones distintas. Valorar renombrarlo a `20261123203616_0001_init.sql`.
3. [D8.4] `updateStatus` llama a `getCurrentStaff`, que lanza un `Error` genérico (`lib/supabase/queries.ts:16-19, 73`) en vez de devolver `{ ok:false }` si falla la lectura de `staff` (p. ej. Supabase no responde). No filtra errores de Postgres, pero rompe el contrato `{ ok, … }` y acaba en `error.tsx`. Igual si faltan variables de entorno. Se recomienda try/catch en la acción.
4. [D7.1] La etiqueta "Email" es un anglicismo; la Fundéu recomienda "correo electrónico" o "correo".
5. `docs/ESPECIFICACION.md` (T6) dice "404 si no existe" y el Orquestador ha aceptado HTTP 200 con "No encontramos esa cita".
6. Sin red no se ha podido renderizar una cita real en `/reserva/[codigo]` ni probar el login (queda para producción).

## Limpieza
- Ninguna fila de prueba quedó fuera de una transacción que se deshace. Tras la revisión: `appointments` = 0, `staff` = 1, `auth.users` = 1, `services` = 5. Usuario del personal sin tocar. Ningún DELETE ni cambio de esquema.
- Servidor local parado. `git status` sin cambios en archivos rastreados.
