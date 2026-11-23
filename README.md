# CitaTaller

Web de **cita previa para un taller mecánico** ficticio ("Taller Demo"). Es una demo: no hay que escribir
datos reales.

- **Clientes**, sin registrarse: eligen servicio, día laborable y hora libre, dejan sus datos y reciben un
  **código de reserva** para consultar el estado de la cita en `/reserva/[codigo]`.
- **Personal del taller**, con email y contraseña: entra en `/panel`, ve el resumen del día, filtra las
  citas por estado y las confirma, completa o cancela.

Reglas: de lunes a viernes; citas a las 09, 10, 11, 12, 15, 16 y 17 h; sin horas pasadas; hasta 60 días
vista; una cita por hueco (las canceladas lo liberan); como máximo 3 citas futuras activas por teléfono.
"Hoy" y "ahora" se calculan siempre en `Europe/Madrid`, aunque el servidor esté en UTC.

## Stack

- **Next.js 16** (App Router, TypeScript estricto, Tailwind CSS 4, Cache Components). La sesión se refresca
  en `src/proxy.ts` (la antigua convención `middleware.ts` ya no se usa).
- **Supabase**: Postgres con RLS en todas las tablas y Auth (email + contraseña) vía `@supabase/ssr`.
  La app usa **solo la clave publicable** y la sesión del usuario.
- **Vercel**: despliegue y un cron diario que llama a `/api/keepalive` para que Supabase no se pause.
- **zod** para validar en el servidor y **Vitest** para los tests.

## Arrancar en local

Requisitos: Node.js 22 o superior.

```bash
npm install
cp .env.example .env.local   # y rellena los valores (ver abajo)
npm run dev                  # http://localhost:3000
```

Scripts:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build de producción y servidor |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Comprobación de tipos |
| `npm test` | Tests de Vitest (`tests/`), sin red ni Supabase |

`npm run build` funciona sin red hacia Supabase: las páginas que leen datos se renderizan en cada petición.
Para compilar sin claves reales basta con valores ficticios, por ejemplo
`NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=dummy npm run build`.

## Variables de entorno

Van en `.env.local` (ignorado por git) y en Vercel (Production y Preview). En el repositorio solo está
`.env.example`, con los nombres vacíos.

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable de Supabase (nunca la secreta) |
| `CRON_SECRET` | Secreto del cron de Vercel: `/api/keepalive` responde 401 sin `Authorization: Bearer <CRON_SECRET>` |

## Base de datos

El esquema está versionado en `supabase/migrations/` y se aplica en orden (en este proyecto, con la
herramienta MCP de Supabase `apply_migration`):

- `services` (lectura pública de los activos), `staff` (quién es personal) y `appointments` (sin acceso
  directo para `anon`; el personal solo puede cambiar la columna `status`).
- Funciones `security definer` con `search_path` vacío: `taken_slots(fecha)`, `book_appointment(…)`,
  `get_booking(codigo)` e `is_staff()`. Las públicas no devuelven datos personales.
- `book_appointment` repite todas las reglas de negocio y devuelve errores con nombre (`SLOT_TAKEN`,
  `TOO_MANY_BOOKINGS`, `INVALID_SLOT`, `INVALID_DATE`, `INVALID_SERVICE`, `INVALID_DATA`), que la app
  traduce a mensajes en español.

`supabase/tests/rls.sql` comprueba RLS, permisos y reglas de negocio: se pega entero en `execute_sql`
(o en el editor SQL de Supabase), devuelve una fila por comprobación y deshace todo lo que crea.

**Dar de alta a alguien del personal**: crea el usuario en Supabase › Authentication y después:

```sql
insert into public.staff (user_id, display_name)
select id, 'Nombre visible' from auth.users where email = 'persona@ejemplo.com';
```

## Estructura

```
src/
  app/                 rutas: / · /reserva/[codigo] · /login · /panel · /api/keepalive
    actions/           Server Actions (booking.ts, auth.ts, panel.ts): validan con zod y devuelven { ok, … }
  components/          interfaz (servidor por defecto; cliente solo donde hay estado o eventos)
  lib/                 lógica pura con tests (schedule, validation, format, status, errors, panel)
    supabase/          clientes de servidor y de proxy, y consultas (server-only)
  proxy.ts             refresco de sesión y redirección de /panel a /login sin sesión
supabase/migrations/   SQL numerado
supabase/tests/        comprobaciones SQL de RLS
tests/                 tests de Vitest
vercel.json            cron diario a /api/keepalive
```

## Equipo de agentes

El proyecto lo construye un equipo de tres agentes de IA con un bucle de revisión:

| Agente | Archivo | Papel |
| --- | --- | --- |
| Orquestador | `CLAUDE.md` | Escribe la especificación (`docs/ESPECIFICACION.md`), reparte tareas, guarda los informes y despliega |
| Develop | `.claude/agents/develop.md` | Programa siguiendo su guía; no se aprueba a sí mismo |
| Testing | `.claude/agents/testing.md` | Revisa cada entrega contra `docs/DIRECTRICES.md` con evidencias; no edita código |

Cada ronda es Develop → Testing. Si Testing rechaza, Develop recibe la lista literal de fallos. Nada llega
a `main` sin un informe APROBADO. El historial está en `docs/REGISTRO-AGENTES.md` y los informes, en
`docs/informes-testing/`.
