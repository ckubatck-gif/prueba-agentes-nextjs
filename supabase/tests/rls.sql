-- CitaTaller · comprobaciones de RLS, permisos y reglas de negocio en la base de datos
-- Cubre D3.1–D3.9, D4.2–D4.5 (parte SQL) y D5.6.
--
-- Cómo ejecutarlo: pegar el archivo ENTERO en la herramienta MCP `execute_sql` (proyecto
-- udanowdiqvymughhxglm) o en el editor SQL de Supabase. Devuelve una fila por comprobación
-- (id, passed, detail). Todo lo que crea (un usuario de Auth ficticio, una fila en staff y
-- varias reservas) se deshace al final del bloque: no deja rastro en la base de datos.

do $$
declare
  v_results jsonb := '[]'::jsonb;
  v_staff_uid uuid := gen_random_uuid();
  v_other_uid uuid := gen_random_uuid();
  v_now timestamp := now() at time zone 'Europe/Madrid';
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_day date;
  v_saturday date;
  v_past date;
  v_too_far date;
  v_code text;
  v_code2 text;
  v_count bigint;
  v_affected bigint;
  v_text text;
  v_row record;
begin
  -- Fechas de prueba calculadas en horario de Madrid.
  v_day := v_today + 7;
  while extract(isodow from v_day) > 5 loop v_day := v_day + 1; end loop;
  v_saturday := v_today + 1;
  while extract(isodow from v_saturday) <> 6 loop v_saturday := v_saturday + 1; end loop;
  v_past := v_today - 7;
  while extract(isodow from v_past) > 5 loop v_past := v_past - 1; end loop;
  v_too_far := v_today + 61;
  while extract(isodow from v_too_far) > 5 loop v_too_far := v_too_far + 1; end loop;

  -- D3.1 · RLS activado en todas las tablas de public
  select count(*) into v_count
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  v_results := v_results || jsonb_build_object('id', 'D3.1', 'passed', v_count = 0,
    'detail', v_count || ' tablas sin RLS');

  -- D3.6 · índice único parcial sobre (fecha, hora) que excluye canceladas
  select count(*) into v_count from pg_indexes
  where schemaname = 'public' and indexname = 'appointments_slot_unique'
    and indexdef ilike 'create unique index%' and indexdef ilike '%cancelada%';
  v_results := v_results || jsonb_build_object('id', 'D3.6-indice', 'passed', v_count = 1,
    'detail', 'índice appointments_slot_unique: ' || v_count);

  -- D3.7 · funciones security definer con search_path vacío y sin execute para PUBLIC
  select count(*) into v_count
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef
    and (p.proconfig is null or not ('search_path=""' = any (p.proconfig))
         or exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
                    where a.grantee = 0));
  v_results := v_results || jsonb_build_object('id', 'D3.7', 'passed', v_count = 0,
    'detail', v_count || ' funciones security definer mal configuradas');

  -- D3.9 · las funciones públicas no devuelven columnas personales
  select count(*) into v_count
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace,
       unnest(p.proargnames, p.proargmodes) as a(arg_name, arg_mode)
  where n.nspname = 'public' and p.proname in ('taken_slots', 'get_booking')
    and a.arg_mode in ('o', 't')
    and a.arg_name in ('customer_name', 'name', 'phone', 'email', 'plate', 'notes');
  v_results := v_results || jsonb_build_object('id', 'D3.9', 'passed', v_count = 0,
    'detail', v_count || ' columnas personales en la salida de taken_slots/get_booking');

  -- Bloque con datos de prueba: se deshace entero al final (excepción CITATALLER_ROLLBACK).
  begin
    insert into auth.users (id, aud, role, email)
    values (v_staff_uid, 'authenticated', 'authenticated', 'rls-test-' || v_staff_uid || '@example.invalid');
    insert into public.staff (user_id, display_name) values (v_staff_uid, 'Prueba RLS');

    -- Reserva válida como anon, con datos sin normalizar (D4.2, D4.3)
    begin
      perform set_config('role', 'anon', true);
      v_code := public.book_appointment('aceite', v_day, '10:00', '  Cliente Prueba ', '+34 612 345 678',
                                        '', '1234-bcd', null);
      perform set_config('role', 'postgres', true);
      select phone, plate, email into v_row from public.appointments where code = v_code;
      v_results := v_results || jsonb_build_object('id', 'D4.2/D4.3-normaliza',
        'passed', v_row.phone = '612345678' and v_row.plate = '1234BCD' and v_row.email is null,
        'detail', 'guardado: ' || v_row.phone || ' / ' || v_row.plate);
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.2/D4.3-normaliza', 'passed', false, 'detail', sqlerrm);
    end;

    -- D3.6 · doble reserva del mismo hueco → SLOT_TAKEN
    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('frenos', v_day, '10:00', 'Otra Persona', '699000111', null, 'PO-1234-AB', null);
      v_results := v_results || jsonb_build_object('id', 'D3.6-doble', 'passed', false, 'detail', 'se permitió la doble reserva');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.6-doble', 'passed', sqlerrm = 'SLOT_TAKEN', 'detail', sqlerrm);
    end;

    -- D4.5 · la función repite las reglas de horario aunque se salte la app
    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_saturday, '10:00', 'Cliente Prueba', '699000222', null, '5678BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D4.5-sabado', 'passed', false, 'detail', 'aceptó un sábado');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.5-sabado', 'passed', sqlerrm = 'INVALID_DATE', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_day, '13:00', 'Cliente Prueba', '699000222', null, '5678BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D4.5-hora', 'passed', false, 'detail', 'aceptó las 13:00');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.5-hora', 'passed', sqlerrm = 'INVALID_SLOT', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_past, '10:00', 'Cliente Prueba', '699000222', null, '5678BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D4.5-pasada', 'passed', false, 'detail', 'aceptó una fecha pasada');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.5-pasada', 'passed', sqlerrm = 'INVALID_DATE', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_too_far, '10:00', 'Cliente Prueba', '699000222', null, '5678BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D4.5-61dias', 'passed', false, 'detail', 'aceptó más de 60 días');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.5-61dias', 'passed', sqlerrm = 'INVALID_DATE', 'detail', sqlerrm);
    end;

    -- Hora ya pasada de hoy: solo se puede probar si hoy es laborable y ya son más de las 09:00 en Madrid.
    if extract(isodow from v_today) <= 5 and v_now::time > time '09:00' then
      begin
        perform set_config('role', 'anon', true);
        perform public.book_appointment('aceite', v_today, '09:00', 'Cliente Prueba', '699000222', null, '5678BCD', null);
        v_results := v_results || jsonb_build_object('id', 'D4.5-hoy-pasada', 'passed', false, 'detail', 'aceptó una hora pasada de hoy');
      exception when others then
        v_results := v_results || jsonb_build_object('id', 'D4.5-hoy-pasada', 'passed', sqlerrm = 'INVALID_SLOT', 'detail', sqlerrm);
      end;
    else
      v_results := v_results || jsonb_build_object('id', 'D4.5-hoy-pasada', 'passed', true,
        'detail', 'no aplicable a esta hora (hoy no laborable o antes de las 09:00)');
    end if;

    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('no-existe', v_day, '11:00', 'Cliente Prueba', '699000222', null, '5678BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D4.5-servicio', 'passed', false, 'detail', 'aceptó un servicio inexistente');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.5-servicio', 'passed', sqlerrm = 'INVALID_SERVICE', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_day, '11:00', 'Cliente Prueba', '699000222', null, '1234AEI', null);
      v_results := v_results || jsonb_build_object('id', 'D4.3-matricula', 'passed', false, 'detail', 'aceptó una matrícula con vocales');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.3-matricula', 'passed', sqlerrm = 'INVALID_DATA', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_day, '11:00', 'Cliente Prueba', '512345678', null, '5678BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D4.2-telefono', 'passed', false, 'detail', 'aceptó un teléfono que empieza por 5');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D4.2-telefono', 'passed', sqlerrm = 'INVALID_DATA', 'detail', sqlerrm);
    end;

    -- D4.2–D4.4 · los CHECK de la tabla rechazan datos inválidos aunque se inserte directamente
    begin
      perform set_config('role', 'postgres', true);
      insert into public.appointments (code, service_id, appointment_date, appointment_time, customer_name, phone, plate)
      values ('TESTCHK2', (select id from public.services where slug = 'aceite'), v_day, '16:00', 'Cliente Prueba', '612 345 678', '1234BCD');
      v_results := v_results || jsonb_build_object('id', 'D4-check', 'passed', false, 'detail', 'el CHECK aceptó un teléfono sin normalizar');
    exception when check_violation then
      v_results := v_results || jsonb_build_object('id', 'D4-check', 'passed', true, 'detail', sqlerrm);
    end;

    -- D5.6 · máximo 3 citas futuras activas por teléfono → TOO_MANY_BOOKINGS
    begin
      perform set_config('role', 'anon', true);
      perform public.book_appointment('aceite', v_day, '11:00', 'Cliente Prueba', '612345678', null, '1234BCD', null);
      perform public.book_appointment('aceite', v_day, '12:00', 'Cliente Prueba', '612345678', null, '1234BCD', null);
      perform public.book_appointment('aceite', v_day, '15:00', 'Cliente Prueba', '612345678', null, '1234BCD', null);
      v_results := v_results || jsonb_build_object('id', 'D5.6', 'passed', false, 'detail', 'aceptó una 4.ª cita activa');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D5.6', 'passed', sqlerrm = 'TOO_MANY_BOOKINGS', 'detail', sqlerrm);
    end;

    -- Funciones públicas: taken_slots y get_booking como anon
    begin
      perform set_config('role', 'anon', true);
      select string_agg(slot, ',') into v_text from public.taken_slots(v_day);
      select count(*) into v_count from public.get_booking(lower(v_code));
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'funciones-publicas',
        'passed', v_text like '%10:00%' and v_count = 1,
        'detail', 'taken_slots: ' || coalesce(v_text, '-') || ' · get_booking: ' || v_count || ' fila');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'funciones-publicas', 'passed', false, 'detail', sqlerrm);
    end;

    -- anon lee los servicios activos y no lee staff
    begin
      perform set_config('role', 'anon', true);
      select count(*) into v_count from public.services;
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'servicios-anon', 'passed', v_count = 5,
        'detail', 'anon ve ' || v_count || ' servicios');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'servicios-anon', 'passed', false, 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      select count(*) into v_count from public.staff;
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'staff-anon', 'passed', v_count = 0, 'detail', 'anon ve ' || v_count || ' filas');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'staff-anon', 'passed', sqlstate = '42501', 'detail', sqlerrm);
    end;

    -- D3.2 · anon no puede leer citas
    begin
      perform set_config('role', 'anon', true);
      select count(*) into v_count from public.appointments;
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'D3.2', 'passed', v_count = 0, 'detail', 'anon ve ' || v_count || ' citas');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.2', 'passed', sqlstate = '42501', 'detail', sqlerrm);
    end;

    -- D3.3 · anon no puede insertar, modificar ni borrar citas directamente
    begin
      perform set_config('role', 'anon', true);
      insert into public.appointments (code, service_id, appointment_date, appointment_time, customer_name, phone, plate)
      values ('TESTANON', 1, v_day, '16:00', 'Intruso', '612345678', '1234BCD');
      v_results := v_results || jsonb_build_object('id', 'D3.3-insert', 'passed', false, 'detail', 'anon insertó una cita');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.3-insert', 'passed', sqlstate = '42501', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'anon', true);
      update public.appointments set status = 'cancelada' where code = v_code;
      get diagnostics v_count = row_count;
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'D3.3-update', 'passed', v_count = 0, 'detail', v_count || ' filas modificadas');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.3-update', 'passed', sqlstate = '42501', 'detail', sqlerrm);
    end;

    -- Borrado: se comprueba por privilegios y políticas (la herramienta MCP execute_sql pide
    -- confirmación manual ante cualquier sentencia de borrado, aunque no afecte a filas).
    select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'appointments' and cmd in ('DELETE', 'ALL');
    v_results := v_results || jsonb_build_object('id', 'D3.3-delete',
      'passed', not has_table_privilege('anon', 'public.appointments', 'DELETE')
                and not has_table_privilege('authenticated', 'public.appointments', 'DELETE')
                and v_count = 0,
      'detail', 'borrado anon: ' || has_table_privilege('anon', 'public.appointments', 'DELETE')
                || ' · authenticated: ' || has_table_privilege('authenticated', 'public.appointments', 'DELETE')
                || ' · políticas de borrado: ' || v_count);

    -- D3.4 · un usuario autenticado que no es personal no ve citas ni puede cambiarlas
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_other_uid, 'role', 'authenticated')::text, true);
      perform set_config('role', 'authenticated', true);
      select count(*) into v_count from public.appointments;
      update public.appointments set status = 'cancelada' where code = v_code;
      get diagnostics v_affected = row_count;
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'D3.4', 'passed', v_count = 0 and v_affected = 0,
        'detail', 've ' || v_count || ' citas · modifica ' || v_affected);
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.4', 'passed', false, 'detail', sqlerrm);
    end;

    -- D3.5 · el personal ve las citas y solo puede cambiar el estado
    perform set_config('request.jwt.claims', json_build_object('sub', v_staff_uid, 'role', 'authenticated')::text, true);
    begin
      perform set_config('role', 'authenticated', true);
      select count(*) into v_count from public.appointments;
      update public.appointments set status = 'confirmada' where code = v_code;
      get diagnostics v_affected = row_count;
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'D3.5-estado', 'passed', v_count >= 1 and v_affected = 1,
        'detail', 'personal ve ' || v_count || ' citas · confirma ' || v_affected);
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.5-estado', 'passed', false, 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'authenticated', true);
      update public.appointments set phone = '699999999' where code = v_code;
      v_results := v_results || jsonb_build_object('id', 'D3.5-telefono', 'passed', false, 'detail', 'el personal cambió el teléfono');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.5-telefono', 'passed', sqlstate = '42501', 'detail', sqlerrm);
    end;

    begin
      perform set_config('role', 'authenticated', true);
      update public.appointments set status = 'pendiente' where code = v_code;
      v_results := v_results || jsonb_build_object('id', 'estados-transicion', 'passed', false, 'detail', 'permitió confirmada → pendiente');
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'estados-transicion', 'passed', sqlerrm = 'INVALID_TRANSITION', 'detail', sqlerrm);
    end;

    -- D3.6 · una cita cancelada libera el hueco
    begin
      perform set_config('role', 'authenticated', true);
      update public.appointments set status = 'cancelada' where code = v_code;
      perform set_config('role', 'anon', true);
      v_code2 := public.book_appointment('frenos', v_day, '10:00', 'Otra Persona', '699000111', null, 'PO-1234-AB', null);
      perform set_config('role', 'postgres', true);
      v_results := v_results || jsonb_build_object('id', 'D3.6-cancelada-libera', 'passed', v_code2 is not null,
        'detail', 'nueva reserva tras cancelar: ' || coalesce(v_code2, '-'));
    exception when others then
      v_results := v_results || jsonb_build_object('id', 'D3.6-cancelada-libera', 'passed', false, 'detail', sqlerrm);
    end;

    raise exception 'CITATALLER_ROLLBACK';
  exception when others then
    if sqlerrm <> 'CITATALLER_ROLLBACK' then
      v_results := v_results || jsonb_build_object('id', 'preparacion', 'passed', false, 'detail', sqlerrm);
    end if;
  end;

  perform set_config('citataller.rls_report', v_results::text, false);
end;
$$;

select r.id, r.passed, r.detail
from jsonb_to_recordset(current_setting('citataller.rls_report')::jsonb) as r (id text, passed boolean, detail text);
