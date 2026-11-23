# Registro del equipo de agentes

Lo mantiene el **Orquestador**. Una fila por ronda Develop ⇄ Testing. Los informes completos de Testing
están en `docs/informes-testing/`.

| Ronda | Fecha | Qué se pidió a Develop | Fallos devueltos por Testing | Veredicto |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-23 | T1–T11 (app completa) | 0 fallos · 6 observaciones | APROBADO → publicado en `main` |

## Decisiones del Orquestador

- 2026-11-23 · Tema elegido: cita previa de taller. Base de datos: Supabase (plan gratuito, región eu-west-3). Despliegue: Vercel (plan Hobby).
- 2026-11-23 · Ronda 1 · Develop entrega T1–T11 (83 tests). Decisiones de Develop que el Orquestador valida:
  - Se acepta que `/reserva/[codigo]` inexistente devuelva HTTP 200 con página "No encontramos esa cita" y `noindex`: con Cache Components el `notFound()` en tiempo de petición llega después del shell, y ninguna directriz exige el 404 de estado.
  - Se aceptan `completada` y `cancelada` como estados finales (trigger `INVALID_TRANSITION`): la especificación no prevé reactivar citas.
  - Se acepta el error extra `INVALID_DATA` y la validación de la matrícula provincial contra la lista de códigos de provincia.
  - D3.3 (borrado) puede verificarse con `has_table_privilege` y ausencia de políticas de borrado, porque la herramienta `execute_sql` exige confirmación manual ante cualquier `DELETE`.
- 2026-11-23 · El Orquestador crea el usuario de prueba del personal (`taller@example.com`, dominio reservado para ejemplos) con su fila en `staff`. La contraseña se generó y se cifró con bcrypt en local; no está en el repositorio.
