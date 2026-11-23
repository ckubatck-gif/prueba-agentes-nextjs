# Informe Testing — Ronda 2 · Producción (D10)
VEREDICTO: APROBADO

> Informe devuelto por el subagente Testing y guardado por el Orquestador.

URL revisada: https://prueba-agentes-nextjs.vercel.app. El alias apunta al despliegue `dpl_7hwSnYTEAtUDAi7sBWvZzAMdps3H` (commit 352ccc7, READY, región cdg1), comprobado con `get_alias`.

| ID | Directriz | Resultado | Evidencia |
| --- | --- | --- | --- |
| D10.1 | Producción responde sin sesión de Vercel | ✅ | **WebFetch sin sesión:** `/`, `/login` y `/reserva/EP4L7AE8` muestran la app; ninguna menciona "Vercel Authentication" ni redirige a vercel.com. Una ruta inexistente → 404 con el not-found de la app ("Esta página no existe"). `get_project`: `ssoProtection`, `passwordProtection` y `trustedIps` desactivados |
| D10.2 | La portada carga los servicios desde Supabase | ✅ | El HTML de `/` contiene los 5 servicios con sus precios, que solo existen en la semilla de la migración (no están escritos en `src/`); los carga `getActiveServices()` |
| D10.2 bis | Consulta de cita sin datos personales | ✅ | `/reserva/EP4L7AE8` → "Confirmada", "Cambio de aceite y filtros", "martes, 24 de noviembre de 2026", "09:00"; sin nombre, teléfono ni matrícula. `/reserva/ZZZZZZZZ` → "No encontramos esa cita" + `noindex` (HTTP 200 aceptado en T6) |
| D10.3 | `/panel` sin sesión → `/login` | ✅ | `x-matched-path: /login`, formulario con "Correo electrónico", "Contraseña" y "Entrar" |
| D10.4 | Cron diario y `/api/keepalive` protegido | ✅ | `vercel.json` diario a las 06:17 UTC; `CRON_SECRET` como variable `sensitive` en Vercel; en producción, sin cabecera → **401**. No se usó el secreto real |
| D10.5 | Login del usuario de prueba | — | Pendiente de prueba manual del humano |
| Runtime | Sin errores en producción | ✅ | `get_runtime_errors` (última hora): ninguno |

## Fallos que Develop tiene que corregir
Ninguno.

## Observaciones (no bloquean)
1. WebFetch mostró en `/login` la etiqueta antigua "Email", aunque el alias, el HTML crudo y el chunk JS público de producción dicen "Correo electrónico": probablemente es una copia en caché de WebFetch. Comprobarlo en incógnito durante la prueba manual de D10.5.
2. Sin JavaScript, `/reserva/ZZZZZZZZ` solo muestra "Buscando tu cita…": el mensaje "No encontramos esa cita" lo pinta React al hidratar (Partial Prerender), coherente con T6.
3. Hay un enlace compartido de Vercel creado por una comprobación anterior con `web_fetch_vercel_url` (caduca el 24/11); no tiene efecto porque la protección está desactivada.
4. `curl` no estaba disponible hacia Vercel desde el entorno de Testing (proxy); la evidencia se tomó con WebFetch y las herramientas de Vercel.

## Limpieza
- Sin filas creadas, sin reservas en producción, sin cambios de esquema.
