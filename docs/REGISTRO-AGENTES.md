# Registro del equipo de agentes

Lo mantiene el **Orquestador**. Una fila por ronda Develop ⇄ Testing. Los informes completos de Testing
están en `docs/informes-testing/`.

| Ronda | Fecha | Qué se pidió a Develop | Fallos devueltos por Testing | Veredicto |
| --- | --- | --- | --- | --- |
| 1 | 2026-11-23 | T1–T11 (app completa) | 0 fallos · 6 observaciones | APROBADO → publicado en `main` |
| 2 | 2026-11-23 | D8.4, D3.10 y D7.8 (directrices endurecidas a partir de las observaciones de la ronda 1) | 0 fallos · 5 observaciones | APROBADO → publicado en `main` |

## Decisiones del Orquestador

- 2026-11-23 · Tema elegido: cita previa de taller. Base de datos: Supabase (plan gratuito, región eu-west-3). Despliegue: Vercel (plan Hobby).
- 2026-11-23 · Ronda 1 · Develop entrega T1–T11 (83 tests). Decisiones de Develop que el Orquestador valida:
  - Se acepta que `/reserva/[codigo]` inexistente devuelva HTTP 200 con página "No encontramos esa cita" y `noindex`: con Cache Components el `notFound()` en tiempo de petición llega después del shell, y ninguna directriz exige el 404 de estado.
  - Se aceptan `completada` y `cancelada` como estados finales (trigger `INVALID_TRANSITION`): la especificación no prevé reactivar citas.
  - Se acepta el error extra `INVALID_DATA` y la validación de la matrícula provincial contra la lista de códigos de provincia.
  - D3.3 (borrado) puede verificarse con `has_table_privilege` y ausencia de políticas de borrado, porque la herramienta `execute_sql` exige confirmación manual ante cualquier `DELETE`.
- 2026-11-23 · Tras la ronda 1 (APROBADA) el Orquestador convierte en directrices tres observaciones de Testing, porque revelan huecos reales en las reglas:
  - **D8.4 endurecida:** ninguna Server Action puede lanzar excepciones, ni siquiera si Supabase no responde o faltan variables (observación 3: `updateStatus` → `getCurrentStaff` → `fail()` lanzaba un `Error`).
  - **D3.10 endurecida:** los archivos de migración se nombran con la versión aplicada, como espera la CLI de Supabase (observación 2).
  - **D7.8 nueva:** sin anglicismos evitables en la interfaz ("correo electrónico", no "email") (observación 4).
  - La observación 5 (T6 decía "404") se resuelve actualizando `docs/ESPECIFICACION.md`.
- 2026-11-23 · Ronda 2 · Develop corrige D8.4, D3.10 y D7.8 (110 tests). Decisiones del Orquestador sobre sus dudas:
  - D7.8: la comprobación literal también encontraba atributos HTML (`type="email"`, `name="email"`…). El fallo era de la directriz, no del código: se aclara la comprobación en `docs/DIRECTRICES.md`.
  - Si faltaran las variables de entorno, `src/proxy.ts` daría un 500 antes de llegar a la acción. Se acepta: las variables están configuradas en Vercel y es un fallo de despliegue, no de la app.
  - El mensaje de login con Supabase caído ("Revisa los datos…") se acepta: es `{ ok:false }` en español.
  - El Orquestador actualiza las guías de los agentes y la especificación con el nuevo nombre de la migración.
- 2026-11-23 · El Orquestador crea el usuario de prueba del personal (`taller@example.com`, dominio reservado para ejemplos) con su fila en `staff`. La contraseña se generó y se cifró con bcrypt en local; no está en el repositorio.
