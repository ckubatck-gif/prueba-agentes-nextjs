# Especificación — CitaTaller

Documento del **Orquestador**. Define qué se construye y lo divide en tareas para Develop.

## Qué es

CitaTaller es la web de cita previa de un taller mecánico (ficticio: "Taller Demo").

- **El cliente** entra sin registrarse, elige servicio, día y hora libre, deja sus datos y recibe un
  **código de reserva** con el que puede consultar el estado de su cita.
- **El personal del taller** entra con usuario y contraseña a un **panel** donde ve las citas y las
  confirma, marca como completadas o cancela.

## Reglas de negocio

- Servicios (tabla `services`, con precio orientativo "desde"):
  | slug | Nombre | Duración | Desde |
  | --- | --- | --- | --- |
  | `aceite` | Cambio de aceite y filtros | 60 min | 89 € |
  | `pre-itv` | Revisión pre-ITV | 60 min | 35 € |
  | `neumaticos` | Neumáticos (montaje y equilibrado) | 60 min | 25 € |
  | `frenos` | Frenos (pastillas y discos) | 60 min | 120 € |
  | `diagnosis` | Diagnosis electrónica | 60 min | 45 € |
- Horario: lunes a viernes; horas de inicio 09:00, 10:00, 11:00, 12:00, 15:00, 16:00 y 17:00.
- Una cita por hueco (fecha + hora). Las canceladas liberan el hueco.
- Reservas desde ahora mismo (sin horas pasadas) hasta 60 días vista. Zona horaria `Europe/Madrid`.
- Un mismo teléfono: máximo 3 citas futuras activas (freno al abuso).
- Estados: `pendiente` → `confirmada` → `completada`; cualquiera menos `completada` puede pasar a `cancelada`.

## Modelo de datos

- `services(id, slug, name, duration_minutes, price_from, active, sort_order)` — lectura pública de los activos.
- `staff(user_id → auth.users, display_name)` — quién es personal del taller.
- `appointments(id, code, service_id, appointment_date, appointment_time, customer_name, phone, email,
  plate, notes, status, created_at, updated_at)` — **sin acceso directo para anon**.
- Funciones públicas (`security definer`):
  - `taken_slots(p_date)` → horas ocupadas de ese día (solo horas, nada personal).
  - `book_appointment(p_service_slug, p_date, p_time, p_name, p_phone, p_email, p_plate, p_notes)` → código.
    Repite todas las reglas de negocio y lanza `SLOT_TAKEN`, `TOO_MANY_BOOKINGS`, `INVALID_SLOT`,
    `INVALID_DATE`, `INVALID_SERVICE`.
  - `get_booking(p_code)` → servicio, fecha, hora y estado (nada personal).
  - `is_staff()` → booleano para las políticas RLS.

## Tareas

| ID | Tarea | Criterio de hecho |
| --- | --- | --- |
| T1 | Dependencias: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `server-only`; dev: `vitest`. Script `"test": "vitest run"`. `.env.example`. | `npm test` arranca |
| T2 | Migración `0001_init.sql`: tipos, tablas, índices, RLS, políticas, grants por columna, funciones y datos de `services`. Aplicarla con MCP. `supabase/tests/rls.sql` con las comprobaciones de D3. | D3 entero |
| T3 | `lib/schedule.ts` y `lib/validation.ts` (puras) con sus tests. | D4.2–D4.4, D5.1–D5.5 |
| T4 | Clientes de Supabase (`lib/supabase/server.ts`, `lib/supabase/proxy.ts`) y `src/proxy.ts`. | D6.1, D6.5, D8.3 |
| T5 | Portada `/`: cabecera, aviso de demo, servicios desde la BD, formulario de reserva por pasos (servicio → día → hora libre → datos) con Server Actions `getAvailability` y `createBooking`. Caja "¿Ya tienes cita?" que lleva a `/reserva/[codigo]`. | D4.1, D5.7, D7 |
| T6 | `/reserva/[codigo]`: muestra servicio, fecha, hora y estado de la cita; si no existe, página "No encontramos esa cita" con `noindex` (decisión del Orquestador en la ronda 1: con Cache Components el estado HTTP es 200). | D7.6 |
| T7 | `/login` y acciones `signIn`/`signOut`. | D6.2, D6.4 |
| T8 | `/panel`: comprobación de `staff` en servidor, resumen (hoy, pendientes, próximos 7 días), lista de citas por fecha con filtro por estado y botones de cambio de estado (Server Action `updateStatus`). | D6.3, D3.5 |
| T9 | `layout.tsx` (lang es, metadatos), `not-found.tsx`, `error.tsx`, estilo coherente y responsive. | D7.1, D7.5, D9.3 |
| T10 | `api/keepalive/route.ts` (401 sin `Authorization: Bearer ${CRON_SECRET}`; si es válida, consulta `services`) y `vercel.json` con cron diario. | D10.4 |
| T11 | `README.md` del proyecto. | D11 |

## Fuera de alcance

Pagos, envío de emails o SMS, varios talleres, edición de servicios desde el panel.
