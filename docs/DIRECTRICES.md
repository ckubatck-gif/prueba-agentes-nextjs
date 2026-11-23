# DIRECTRICES — lo que Develop tiene que cumplir

Este documento pertenece al agente **Testing**. Develop lo lee para saber cómo se le va a juzgar.
Solo el Orquestador puede cambiarlo, y cada cambio se anota en `docs/REGISTRO-AGENTES.md`.

Todas las directrices son **obligatorias** salvo las marcadas *(recomendada)*.
Cada una indica **cómo la comprueba Testing**.

---

## D1 · Calidad del build

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D1.1 | `npm run lint` termina sin errores | Ejecutar el comando |
| D1.2 | `npx tsc --noEmit` termina sin errores | Ejecutar el comando |
| D1.3 | `npm test` pasa todos los tests y hay al menos 20 | Ejecutar el comando y contar |
| D1.4 | `npm run build` termina bien con variables ficticias y sin red hacia Supabase | Ejecutar el comando |

## D2 · Secretos

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D2.1 | Ningún `.env*` rastreado por git salvo `.env.example` | `git ls-files \| grep -E '(^\|/)\.env'` → solo `.env.example` |
| D2.2 | `.env.example` contiene los nombres de las variables y ningún valor real | Leer el archivo |
| D2.3 | Ninguna clave en archivos rastreados | `git ls-files -z \| xargs -0 grep -nE 'sb_secret_\|sb_publishable_[A-Za-z0-9]\|eyJhbGciOi\|service_role'` → sin resultados (salvo texto explicativo en `.md`) |
| D2.4 | La app no usa la clave `service_role`/`secret` en ningún sitio | `grep -rn "SERVICE_ROLE\|SECRET_KEY" src` → sin resultados (salvo `CRON_SECRET`) |

## D3 · Base de datos y seguridad (Supabase)

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D3.1 | RLS activado en todas las tablas de `public` | `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity;` → 0 filas |
| D3.2 | `anon` no puede leer citas | `begin; set local role anon; select count(*) from public.appointments; rollback;` → 0 o permiso denegado |
| D3.3 | `anon` no puede insertar, modificar ni borrar citas directamente | Intentar `insert`/`update`/`delete` como `anon` → error o 0 filas afectadas |
| D3.4 | Un usuario autenticado que **no** es del personal del taller no ve citas | Como `authenticated` con un `request.jwt.claims` de un uid que no está en `staff` → 0 filas |
| D3.5 | El personal del taller solo puede cambiar el **estado** de una cita, no los datos del cliente | Revisar `grant update (…)` / políticas; intentar `update … set phone=…` como personal → error |
| D3.6 | Imposible reservar dos veces la misma fecha y hora (salvo citas canceladas) | Índice único parcial en la base de datos + intento de doble reserva → `SLOT_TAKEN` |
| D3.7 | Funciones `security definer` con `set search_path = ''`, y `execute` revocado a `public` | Revisar migraciones y `pg_proc.proconfig` |
| D3.8 | `get_advisors` (security) sin avisos de nivel ERROR | Herramienta MCP de Supabase |
| D3.9 | Las funciones públicas no devuelven datos personales (nombre, teléfono, email, matrícula) | Revisar la firma de `taken_slots` y `get_booking` |
| D3.10 | El esquema está versionado en `supabase/migrations/` y coincide con lo aplicado. Cada archivo se llama `<versión aplicada>_<nombre>.sql` (p. ej. `20261123203616_0001_init.sql`), como espera la CLI de Supabase | `list_migrations` frente a los nombres y el contenido de los archivos *(endurecida en ronda 2)* |

## D4 · Validación de datos (doble: servidor y base de datos)

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D4.1 | La Server Action de reserva valida con zod **antes** de llamar a Supabase | Leer `src/app/actions/booking.ts` |
| D4.2 | Teléfono español de 9 cifras que empieza por 6, 7, 8 o 9; acepta espacios y prefijo `+34`/`0034` y se guarda normalizado | Tests en `tests/validation.test.ts` + CHECK en la tabla |
| D4.3 | Matrícula española actual (`1234 BCD`, sin vocales ni Ñ ni Q) o provincial (`PO-1234-AB`); se guarda en mayúsculas sin espacios ni guiones | Tests + CHECK |
| D4.4 | Nombre de 2 a 80 caracteres; email opcional pero válido si se rellena; comentario de 500 caracteres como máximo | Tests + CHECK |
| D4.5 | La función SQL de reserva repite las reglas de horario (D5) aunque se salte la app | Llamar a `book_appointment` como `anon` con sábado / hora no válida / fecha pasada → error |

## D5 · Reglas de negocio (horario del taller)

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D5.1 | Solo de lunes a viernes | Tests de `lib/schedule.ts` |
| D5.2 | Horas de cita: 09:00, 10:00, 11:00, 12:00, 15:00, 16:00 y 17:00 | Tests |
| D5.3 | No se puede reservar una hora ya pasada (hoy incluido) | Tests con un "ahora" inyectado |
| D5.4 | Como máximo 60 días hacia delante | Tests |
| D5.5 | "Hoy" y "ahora" se calculan en `Europe/Madrid`: a las 23:30 UTC del domingo en Madrid ya es lunes | Test explícito de cambio de día |
| D5.6 | Un mismo teléfono no puede tener más de 3 citas futuras activas | Función SQL → `TOO_MANY_BOOKINGS` |
| D5.7 | El formulario solo ofrece horas libres de días laborables | Revisar componente + `taken_slots` |

## D6 · Autenticación y panel

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D6.1 | `/panel` sin sesión redirige a `/login` | `curl -sI http://localhost:3000/panel` con `npm start` → 307 a `/login` |
| D6.2 | El login usa Supabase Auth (email + contraseña) y muestra un error en español si falla | Leer código |
| D6.3 | El panel comprueba en el servidor que el usuario está en `staff`; si no, no muestra datos | Leer `src/app/panel/page.tsx` |
| D6.4 | Hay botón de cerrar sesión que funciona | Leer código |
| D6.5 | La sesión se refresca en `src/proxy.ts` (convención de Next.js 16, no `middleware.ts`) | Existe `src/proxy.ts` y no existe `middleware.ts` |

## D7 · Interfaz y accesibilidad

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D7.1 | `<html lang="es">` y todo el texto visible en español de España | Leer `layout.tsx` y componentes |
| D7.2 | Cada campo de formulario tiene `<label>` asociado | Revisar formularios |
| D7.3 | Los errores aparecen junto al campo y en español, asociados con `aria-describedby` o `role="alert"` | Revisar formularios |
| D7.4 | Los botones de envío se deshabilitan mientras se envía | Revisar (`useActionState`/`useFormStatus` o equivalente) |
| D7.5 | Sin desbordes horizontales a 360 px (sin anchos fijos > 360 px) | Revisar clases |
| D7.6 | Tras reservar se muestra un código de reserva y se puede consultar en `/reserva/[codigo]` | Leer código |
| D7.7 | Aviso visible de que es una demo y no hay que introducir datos reales | Leer portada |
| D7.8 | Sin anglicismos evitables en la interfaz: "correo electrónico" (o "correo"), no "email"; "contraseña", no "password" | `grep -rniE 'e-?mail' src/components src/app src/lib/validation.ts src/lib/errors.ts` y revisar que ninguna coincidencia sea texto visible (etiquetas, placeholders, mensajes). Quedan fuera los atributos HTML estándar (`type`, `name`, `inputMode`, `autoComplete`) y los nombres de campo en código *(añadida en ronda 2; comprobación aclarada por el Orquestador)* |

## D8 · Calidad de código

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D8.1 | Sin `any` ni `@ts-ignore` en `src/` | `grep -rnE ':\s*any\b\|as any\|@ts-ignore' src` → sin resultados |
| D8.2 | Sin `console.log` en `src/` | `grep -rn "console.log" src` → sin resultados |
| D8.3 | `lib/supabase/server.ts` importa `server-only` y ningún componente `'use client'` importa `lib/supabase` | `grep` |
| D8.4 | Las Server Actions devuelven `{ ok, … }` tipado y no lanzan errores de Postgres al usuario. **Ninguna acción lanza excepciones**: si Supabase no responde, faltan variables de entorno o falla una lectura auxiliar (p. ej. `staff`), la acción captura el error y devuelve `{ ok: false, error }` en español. Única excepción: el `redirect()` de Next tras un login/logout correcto | Leer `src/app/actions/` y lo que llaman; test que simule el fallo de Supabase *(añadida en ronda 2)* |
| D8.5 | Ningún archivo de `src/` pasa de 250 líneas | `find src -name '*.ts*' \| xargs wc -l` |
| D8.6 | Código (nombres) en inglés; interfaz en español | Revisión |

## D9 · Convenciones de Next.js 16

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D9.1 | `cookies()`, `headers()`, `params` y `searchParams` se usan con `await` | `grep` + `tsc` |
| D9.2 | Las páginas que leen de Supabase se renderizan dinámicamente (no fallan en el build sin red) | D1.4 |
| D9.3 | Hay `not-found.tsx` y manejo de error (`error.tsx`) en la app | Existen los archivos |

## D10 · Producción (solo en la ronda de despliegue)

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D10.1 | La URL de producción `*.vercel.app` responde 200 **sin sesión de Vercel** (no aparece "Vercel Authentication" ni redirección a vercel.com/login) | WebFetch / `curl` sin cookies |
| D10.2 | La portada carga los servicios desde Supabase | El HTML contiene los nombres de los servicios |
| D10.3 | `/panel` sin sesión redirige a `/login` en producción | `curl -sI` / WebFetch |
| D10.4 | `vercel.json` define un cron diario a `/api/keepalive` protegido con `CRON_SECRET` | Leer `vercel.json` y la ruta; sin cabecera → 401 |
| D10.5 | El usuario de prueba puede iniciar sesión y ve el panel | Prueba manual del Orquestador o del humano |

## D11 · Documentación

| ID | Directriz | Cómo se comprueba |
| --- | --- | --- |
| D11.1 | `README.md` explica qué es la app, cómo arrancarla, las variables de entorno y el equipo de agentes | Leer |
| D11.2 | `.env.example` actualizado con todas las variables que usa el código | Comparar con `grep -rn "process.env" src` |
| D11.3 *(recomendada)* | Comentarios solo donde el código no se explica solo | Revisión |
