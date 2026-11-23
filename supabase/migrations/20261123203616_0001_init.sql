-- CitaTaller · 0001_init
-- Esquema inicial: servicios, personal del taller, citas, RLS, permisos por columna
-- y funciones públicas (security definer) para reservar y consultar sin exponer datos personales.
--
-- Reglas que se repiten aquí aunque la app ya las valide (doble validación):
--   · lunes a viernes; horas 09, 10, 11, 12, 15, 16 y 17; sin horas pasadas; máximo 60 días vista;
--   · "hoy" y "ahora" en Europe/Madrid;
--   · una cita por hueco salvo canceladas; máximo 3 citas futuras activas por teléfono.

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.appointment_status as enum ('pendiente', 'confirmada', 'completada', 'cancelada');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.services (
  id smallint generated always as identity primary key,
  slug text not null unique
    check (char_length(slug) <= 40 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  duration_minutes smallint not null check (duration_minutes between 15 and 480),
  price_from numeric(8, 2) not null check (price_from >= 0),
  active boolean not null default true,
  sort_order smallint not null default 0
);

create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{8}$'),
  service_id smallint not null references public.services (id),
  appointment_date date not null
    constraint appointments_weekday check (extract(isodow from appointment_date) between 1 and 5),
  appointment_time time not null
    constraint appointments_slot_time check (
      appointment_time in ('09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00')
    ),
  customer_name text not null
    constraint appointments_customer_name check (
      char_length(customer_name) between 2 and 80
      and customer_name = btrim(customer_name)
      and customer_name !~ '[[:cntrl:]]'
    ),
  -- Teléfono español normalizado: 9 cifras que empiezan por 6, 7, 8 o 9.
  phone text not null constraint appointments_phone check (phone ~ '^[6-9][0-9]{8}$'),
  email text constraint appointments_email check (
    email is null
    or (char_length(email) <= 254 and email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  ),
  -- Matrícula normalizada (mayúsculas, sin espacios ni guiones):
  --   actual: 4 cifras + 3 consonantes (sin vocales, Ñ ni Q) → 1234BCD
  --   provincial: código de provincia + 4 cifras + 1 o 2 letras → PO1234AB
  plate text not null constraint appointments_plate check (
    plate ~ '^([0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}|(A|AB|AL|AV|B|BA|BI|BU|C|CA|CC|CE|CO|CR|CS|CU|GC|GE|GI|GR|GU|H|HU|IB|J|L|LE|LO|LU|M|MA|ML|MU|NA|O|OR|OU|P|PM|PO|S|SA|SE|SG|SO|SS|T|TE|TF|TO|V|VA|VI|Z|ZA)[0-9]{4}[A-Z]{1,2})$'
  ),
  notes text constraint appointments_notes check (notes is null or char_length(notes) <= 500),
  status public.appointment_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un hueco (fecha + hora) solo puede tener una cita que no esté cancelada.
create unique index appointments_slot_unique
  on public.appointments (appointment_date, appointment_time)
  where status <> 'cancelada';

create index appointments_date_time_idx on public.appointments (appointment_date, appointment_time);
create index appointments_service_id_idx on public.appointments (service_id);
create index appointments_phone_active_idx
  on public.appointments (phone, appointment_date)
  where status in ('pendiente', 'confirmada');

-- ---------------------------------------------------------------------------
-- Trigger: transiciones de estado válidas y updated_at
--   pendiente → confirmada | cancelada
--   confirmada → completada | cancelada
--   completada y cancelada son estados finales
-- ---------------------------------------------------------------------------

create function public.appointments_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'pendiente' and new.status in ('confirmada', 'cancelada'))
      or (old.status = 'confirmada' and new.status in ('completada', 'cancelada'))
    ) then
      raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger appointments_before_update
  before update on public.appointments
  for each row execute function public.appointments_before_update();

-- ---------------------------------------------------------------------------
-- Funciones públicas (security definer, search_path vacío, nombres cualificados)
-- ---------------------------------------------------------------------------

-- ¿El usuario de la sesión es personal del taller? Se usa en las políticas RLS.
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s where s.user_id = (select auth.uid())
  );
$$;

-- Horas ocupadas de un día (solo la hora, nada personal). Fuera del rango reservable no devuelve nada.
create function public.taken_slots(p_date date)
returns table (slot text)
language sql
stable
security definer
set search_path = ''
as $$
  select to_char(a.appointment_time, 'HH24:MI')
  from public.appointments a
  where a.appointment_date = p_date
    and a.status <> 'cancelada'
    and p_date between (now() at time zone 'Europe/Madrid')::date
                   and (now() at time zone 'Europe/Madrid')::date + 60
  order by a.appointment_time;
$$;

-- Estado de una reserva a partir de su código (servicio, fecha, hora y estado; nada personal).
create function public.get_booking(p_code text)
returns table (
  code text,
  service_name text,
  appointment_date date,
  appointment_time text,
  status public.appointment_status
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.code, s.name, a.appointment_date, to_char(a.appointment_time, 'HH24:MI'), a.status
  from public.appointments a
  join public.services s on s.id = a.service_id
  where a.code = upper(regexp_replace(coalesce(p_code, ''), '[\s-]', '', 'g'));
$$;

-- Reserva una cita y devuelve su código. Repite todas las reglas de negocio.
-- Errores: INVALID_SERVICE, INVALID_DATE, INVALID_SLOT, INVALID_DATA, TOO_MANY_BOOKINGS, SLOT_TAKEN.
create function public.book_appointment(
  p_service_slug text,
  p_date date,
  p_time time,
  p_name text,
  p_phone text,
  p_email text default null,
  p_plate text default null,
  p_notes text default null
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now timestamp := now() at time zone 'Europe/Madrid';
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_service_id smallint;
  v_name text := btrim(coalesce(p_name, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[\s.-]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_plate text := upper(regexp_replace(coalesce(p_plate, ''), '[\s-]', '', 'g'));
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_active_count integer;
  v_bytes bytea;
  v_code text;
  v_constraint text;
begin
  select s.id into v_service_id
  from public.services s
  where s.slug = p_service_slug and s.active;

  if v_service_id is null then
    raise exception 'INVALID_SERVICE' using errcode = 'P0001';
  end if;

  if p_date is null
     or p_date < v_today
     or p_date > v_today + 60
     or extract(isodow from p_date) > 5 then
    raise exception 'INVALID_DATE' using errcode = 'P0001';
  end if;

  if p_time is null
     or p_time not in (time '09:00', time '10:00', time '11:00', time '12:00',
                       time '15:00', time '16:00', time '17:00')
     or (p_date + p_time) <= v_now then
    raise exception 'INVALID_SLOT' using errcode = 'P0001';
  end if;

  v_phone := regexp_replace(v_phone, '^(\+34|0034)', '');

  if char_length(v_name) not between 2 and 80
     or v_name ~ '[[:cntrl:]]'
     or v_phone !~ '^[6-9][0-9]{8}$'
     or (v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'))
     or v_plate !~ '^([0-9]{4}[BCDFGHJKLMNPRSTVWXYZ]{3}|(A|AB|AL|AV|B|BA|BI|BU|C|CA|CC|CE|CO|CR|CS|CU|GC|GE|GI|GR|GU|H|HU|IB|J|L|LE|LO|LU|M|MA|ML|MU|NA|O|OR|OU|P|PM|PO|S|SA|SE|SG|SO|SS|T|TE|TF|TO|V|VA|VI|Z|ZA)[0-9]{4}[A-Z]{1,2})$'
     or (v_notes is not null and char_length(v_notes) > 500) then
    raise exception 'INVALID_DATA' using errcode = 'P0001';
  end if;

  -- Serializa las reservas de un mismo teléfono para que el límite no se salte con peticiones simultáneas.
  perform pg_advisory_xact_lock(hashtextextended('citataller:phone:' || v_phone, 0));

  select count(*) into v_active_count
  from public.appointments a
  where a.phone = v_phone
    and a.status in ('pendiente', 'confirmada')
    and (a.appointment_date + a.appointment_time) > v_now;

  if v_active_count >= 3 then
    raise exception 'TOO_MANY_BOOKINGS' using errcode = 'P0001';
  end if;

  for attempt in 1..5 loop
    v_bytes := extensions.gen_random_bytes(8);
    v_code := '';
    for i in 0..7 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;

    begin
      insert into public.appointments (
        code, service_id, appointment_date, appointment_time,
        customer_name, phone, email, plate, notes
      ) values (
        v_code, v_service_id, p_date, p_time,
        v_name, v_phone, v_email, v_plate, v_notes
      );
      return v_code;
    exception when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      if v_constraint = 'appointments_slot_unique' then
        raise exception 'SLOT_TAKEN' using errcode = 'P0001';
      end if;
      -- Colisión del código aleatorio: se reintenta con otro.
    end;
  end loop;

  raise exception 'CODE_GENERATION_FAILED' using errcode = 'P0001';
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS y permisos. Por defecto nadie ve nada; se abre solo lo necesario.
-- ---------------------------------------------------------------------------

alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;

-- Supabase concede por defecto todos los permisos a anon y authenticated: se retiran.
revoke all on table public.services, public.staff, public.appointments from anon, authenticated;
revoke all on sequence public.services_id_seq from anon, authenticated;

grant select on table public.services to anon, authenticated;
grant select on table public.staff to authenticated;
grant select on table public.appointments to authenticated;
-- El personal solo puede cambiar el estado; updated_at lo pone el trigger.
grant update (status) on table public.appointments to authenticated;

create policy services_select_active on public.services
  for select to anon, authenticated
  using (active);

create policy staff_select_own on public.staff
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy appointments_select_staff on public.appointments
  for select to authenticated
  using ((select public.is_staff()));

create policy appointments_update_staff on public.appointments
  for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

revoke execute on function public.appointments_before_update() from public, anon, authenticated;
revoke execute on function public.is_staff() from public, anon, authenticated;
revoke execute on function public.taken_slots(date) from public, anon, authenticated;
revoke execute on function public.get_booking(text) from public, anon, authenticated;
revoke execute on function public.book_appointment(text, date, time, text, text, text, text, text)
  from public, anon, authenticated;

grant execute on function public.is_staff() to authenticated;
grant execute on function public.taken_slots(date) to anon, authenticated;
grant execute on function public.get_booking(text) to anon, authenticated;
grant execute on function public.book_appointment(text, date, time, text, text, text, text, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Datos iniciales
-- ---------------------------------------------------------------------------

insert into public.services (slug, name, duration_minutes, price_from, sort_order) values
  ('aceite', 'Cambio de aceite y filtros', 60, 89, 1),
  ('pre-itv', 'Revisión pre-ITV', 60, 35, 2),
  ('neumaticos', 'Neumáticos (montaje y equilibrado)', 60, 25, 3),
  ('frenos', 'Frenos (pastillas y discos)', 60, 120, 4),
  ('diagnosis', 'Diagnosis electrónica', 60, 45, 5);
