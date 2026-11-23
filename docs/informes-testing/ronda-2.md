# Informe Testing — Ronda 2
VEREDICTO: APROBADO

> Informe devuelto por el subagente Testing y guardado por el Orquestador (tabla condensada en las directrices sin cambios respecto a la ronda 1; las directrices nuevas o endurecidas, completas).

Alcance: D1–D9, D11 y la parte local de D10.4. No se cuenta como fallo lo que el Orquestador aceptó en `docs/REGISTRO-AGENTES.md` (500 del proxy si faltan variables; mensaje de login con Supabase caído).

| ID | Directriz | Resultado | Evidencia |
| --- | --- | --- | --- |
| D1.1–D1.2 | lint y tsc | ✅ | exit 0 en ambos |
| D1.3 | tests ≥ 20 | ✅ | `Test Files 10 passed (10)`, `Tests 110 passed (110)`; igual con `TZ=UTC` |
| D1.4 | build sin red con variables ficticias | ✅ | exit 0 en el proyecto y en una copia limpia en /tmp sin `.next` ni `.env.local` |
| D2.1–D2.4 | secretos | ✅ | Solo `.env.example` rastreado; ninguna clave en archivos ni en `git log -p --all`; único secreto usado: `CRON_SECRET` |
| D3.1–D3.9 | base de datos y seguridad | ✅ | RLS en las 3 tablas; anon → 42501 al leer/insertar; `has_table_privilege` false; no-personal ve 0; personal solo `UPDATE:status`; `SLOT_TAKEN`; `search_path=""`; 0 ERROR en advisors; funciones sin datos personales. `supabase/tests/rls.sql` 28/28 |
| **D3.10** | migraciones = aplicadas y nombre `<versión>_<nombre>.sql` *(ronda 2)* | ✅ | `list_migrations` → `20261123203616 / 0001_init`. Único archivo: `supabase/migrations/20261123203616_0001_init.sql`. md5 del archivo = md5 de `schema_migrations.statements` = md5 del archivo antiguo en `HEAD` (`30a93996…`); ninguna referencia al nombre antiguo |
| D4.1–D4.5 | validación doble | ✅ | zod antes de `createClient()`; teléfono, matrícula, nombre, correo y notas con tests y CHECK; `book_appointment` repite el horario |
| D5.1–D5.7 | horario | ✅ | 21 tests de `schedule` (incluido D5.5); `TOO_MANY_BOOKINGS` |
| D6.1–D6.5 | autenticación | ✅ | `/panel` → 307 `/login`; `signInWithPassword` + mensajes en español; `staff` comprobado en servidor; `src/proxy.ts` |
| D7.1–D7.7 | interfaz | ✅ | Sin regresiones |
| **D7.8** | sin anglicismos *(ronda 2)* | ✅ | 33 coincidencias de `e-?mail`, todas fuera del texto visible (atributos, variables, claves de zod/RPC, códigos de Supabase). Texto visible: "Correo electrónico" (`login-form.tsx:24`, `details-step.tsx:67`), "Correo" (`appointment-list.tsx:72`) |
| D8.1–D8.3 | calidad | ✅ | Sin `any`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable` ni `console.log`; `server-only` |
| **D8.4** | las acciones nunca lanzan *(ronda 2)* | ✅ | **Código:** el manifiesto expone 5 acciones y las 5 ejecutan su cuerpo dentro de `guardAction`; `redirect()` fuera del guard y solo si `ok`; el guard hace `unstable_rethrow` y registra solo `error.name`. **Tests:** 20 de acciones y guard en verde. **Mutaciones** (en copia en /tmp): sin try/catch → 13 tests fallan; sin `unstable_rethrow` → falla "no captura el redirect() ni el notFound()". **HTTP** contra `npm start` con Supabase inalcanzable: `getAvailability`, `createBooking` y `signIn` → `{ ok:false, error }` en español con HTTP 200 |
| D8.5–D8.6 | tamaño y nombres | ✅ | Archivo más largo: 166 líneas; nombres nuevos en inglés |
| D9.1–D9.3 | Next.js 16 | ✅ | Sin regresiones |
| D10.4 (local) | cron y 401 | ✅ | Sin cabecera / `Bearer malo` / token de igual longitud y distinto valor → 401; correcto → 503 (solo por falta de red); `timingSafeEqual` |
| D11.1–D11.3 | documentación | ✅ | README con el nombre nuevo de la migración |

## Fallos que Develop tiene que corregir
Ninguno.

## Observaciones (no bloquean)
1. [Commit] La migración renombrada, los tests nuevos y `src/lib/action-guard.ts` están sin rastrear: el commit tiene que hacerse con `git add -A` o D3.10 fallaría en `main`.
2. [D8.4] `updateStatus` y `signOut` se han verificado con tests y mutaciones, no por HTTP (el proxy exige una sesión válida que no se puede generar sin red).
3. [D3.8] Sigue el WARN `auth_leaked_password_protection` (configuración de Supabase › Authentication, no de código).
4. Con la red caída, los logs de las acciones salen con el código de error vacío (`code: ""` de postgrest-js); usar "sin código" como en `queries.ts` facilitaría el diagnóstico.
5. [D11] La línea de `lib/` en "Estructura" del README no menciona `action-guard` (cosmético).

## Limpieza
- Todo lo creado por `rls.sql` y por las pruebas de Testing se deshizo dentro de transacciones. Estado final: `appointments` = 0, `staff` = 1, `auth.users` = 1, `services` = 5, `schema_migrations` = 1.
- Servidor local parado; copia de mutaciones en /tmp borrada; `.next` regenerado con un build normal; `git status` igual que al empezar.
