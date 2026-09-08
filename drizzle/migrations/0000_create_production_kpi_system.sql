-- ===== ROLES =====
create type public.app_role as enum ('operator','line_leader','supervisor','manager','qa','maintenance','admin','management');
create type public.kpi_status as enum ('draft','pending','approved','rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  employee_code text,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = any(_roles))
$$;

create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_any_role(auth.uid(), array['admin','manager','supervisor','management']::public.app_role[]));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "roles read" on public.user_roles for select to authenticated using (true);

grant insert, update, delete on public.user_roles to authenticated;
create policy "admin manage roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- first user becomes admin, others operator
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email);
  select count(*) into cnt from public.user_roles;
  if cnt = 0 then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles(user_id, role)
    values (new.id, coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'operator'));
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== MASTER DATA =====
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null,
  start_time time, end_time time,
  planned_minutes int not null default 480,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.production_lines (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null, department text,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.machines (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null,
  line_id uuid references public.production_lines(id) on delete set null,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null, unit text not null default 'ชิ้น',
  standard_cycle_time_sec numeric,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.defect_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null, category text,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.downtime_reasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, name text not null, category text,
  is_active boolean not null default true, created_at timestamptz not null default now()
);

-- ===== KPI RECORDS =====
create table public.kpi_records (
  id uuid primary key default gen_random_uuid(),
  prod_date date not null,
  shift_id uuid not null references public.shifts(id),
  line_id uuid not null references public.production_lines(id),
  machine_id uuid references public.machines(id),
  product_id uuid references public.products(id),
  work_order text,
  planned_minutes int not null default 480 check (planned_minutes > 0),
  target_qty numeric not null default 0 check (target_qty >= 0),
  actual_qty numeric not null default 0 check (actual_qty >= 0),
  good_qty numeric not null default 0 check (good_qty >= 0),
  defect_qty numeric not null default 0 check (defect_qty >= 0),
  scrap_qty numeric not null default 0 check (scrap_qty >= 0),
  rework_qty numeric not null default 0 check (rework_qty >= 0),
  raw_material_qty numeric,
  downtime_minutes numeric not null default 0 check (downtime_minutes >= 0),
  manpower numeric not null default 0 check (manpower >= 0),
  cycle_time_sec numeric,
  remark text,
  status public.kpi_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  reject_reason text,
  achievement_rate numeric generated always as (case when target_qty > 0 then round(actual_qty*100/target_qty,2) else null end) stored,
  defect_rate numeric generated always as (case when actual_qty > 0 then round(defect_qty*100/actual_qty,2) else null end) stored,
  quality_rate numeric generated always as (case when actual_qty > 0 then round(good_qty*100/actual_qty,2) else null end) stored,
  availability numeric generated always as (case when planned_minutes > 0 then round(greatest(planned_minutes-downtime_minutes,0)*100/planned_minutes,2) else null end) stored,
  yield_rate numeric generated always as (case when raw_material_qty > 0 then round(good_qty*100/raw_material_qty,2) else null end) stored
);
create index on public.kpi_records (prod_date);
create index on public.kpi_records (status);
create index on public.kpi_records (line_id);

create table public.kpi_defects (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.kpi_records(id) on delete cascade,
  defect_type_id uuid not null references public.defect_types(id),
  qty numeric not null default 0 check (qty >= 0),
  note text
);
create table public.kpi_downtimes (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.kpi_records(id) on delete cascade,
  reason_id uuid not null references public.downtime_reasons(id),
  minutes numeric not null default 0 check (minutes >= 0),
  note text
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger kpi_touch before update on public.kpi_records
  for each row execute function public.touch_updated_at();

-- grants + RLS for master data
do $$
declare t text;
begin
  foreach t in array array['shifts','production_lines','machines','products','defect_types','downtime_reasons'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "read all" on public.%I for select to authenticated using (true)', t);
    execute format($f$create policy "admin write" on public.%I for insert to authenticated with check (public.has_any_role(auth.uid(), array['admin','qa','maintenance']::public.app_role[]))$f$, t);
    execute format($f$create policy "admin update" on public.%I for update to authenticated using (public.has_any_role(auth.uid(), array['admin','qa','maintenance']::public.app_role[]))$f$, t);
    execute format($f$create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),'admin'))$f$, t);
  end loop;
end $$;

grant select, insert, update, delete on public.kpi_records to authenticated;
grant all on public.kpi_records to service_role;
alter table public.kpi_records enable row level security;
create policy "kpi read" on public.kpi_records for select to authenticated using (true);
create policy "kpi insert" on public.kpi_records for insert to authenticated
  with check (public.has_any_role(auth.uid(), array['operator','line_leader','supervisor','admin']::public.app_role[]));
create policy "kpi update" on public.kpi_records for update to authenticated
  using (
    public.has_any_role(auth.uid(), array['supervisor','manager','admin']::public.app_role[])
    or (created_by = auth.uid() and status in ('draft','rejected'))
  );
create policy "kpi delete" on public.kpi_records for delete to authenticated
  using (public.has_role(auth.uid(),'admin') or (created_by = auth.uid() and status = 'draft'));

grant select, insert, update, delete on public.kpi_defects to authenticated;
grant all on public.kpi_defects to service_role;
alter table public.kpi_defects enable row level security;
create policy "kd read" on public.kpi_defects for select to authenticated using (true);
create policy "kd write" on public.kpi_defects for insert to authenticated
  with check (public.has_any_role(auth.uid(), array['operator','line_leader','supervisor','admin','qa']::public.app_role[]));
create policy "kd update" on public.kpi_defects for update to authenticated
  using (public.has_any_role(auth.uid(), array['line_leader','supervisor','admin','qa']::public.app_role[]));
create policy "kd delete" on public.kpi_defects for delete to authenticated
  using (public.has_any_role(auth.uid(), array['line_leader','supervisor','admin']::public.app_role[]));

grant select, insert, update, delete on public.kpi_downtimes to authenticated;
grant all on public.kpi_downtimes to service_role;
alter table public.kpi_downtimes enable row level security;
create policy "kt read" on public.kpi_downtimes for select to authenticated using (true);
create policy "kt write" on public.kpi_downtimes for insert to authenticated
  with check (public.has_any_role(auth.uid(), array['operator','line_leader','supervisor','admin','maintenance']::public.app_role[]));
create policy "kt update" on public.kpi_downtimes for update to authenticated
  using (public.has_any_role(auth.uid(), array['line_leader','supervisor','admin','maintenance']::public.app_role[]));
create policy "kt delete" on public.kpi_downtimes for delete to authenticated
  using (public.has_any_role(auth.uid(), array['line_leader','supervisor','admin']::public.app_role[]));

grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit read" on public.audit_logs for select to authenticated
  using (public.has_any_role(auth.uid(), array['admin','manager','management']::public.app_role[]));
create policy "audit insert" on public.audit_logs for insert to authenticated
  with check (user_id = auth.uid());

-- ===== SEED MASTER DATA =====
insert into public.shifts (code,name,start_time,end_time,planned_minutes) values
 ('A','กะเช้า (A)','08:00','16:00',480),
 ('B','กะบ่าย (B)','16:00','00:00',480),
 ('C','กะกลางคืน (C)','00:00','08:00',480);
insert into public.production_lines (code,name,department) values
 ('L01','ไลน์ประกอบ 1','ฝ่ายผลิต'),
 ('L02','ไลน์ประกอบ 2','ฝ่ายผลิต'),
 ('L03','ไลน์บรรจุภัณฑ์','ฝ่ายผลิต');
insert into public.machines (code,name,line_id) values
 ('M01','เครื่องฉีดพลาสติก A',(select id from public.production_lines where code='L01')),
 ('M02','เครื่องประกอบอัตโนมัติ B',(select id from public.production_lines where code='L02')),
 ('M03','เครื่องบรรจุ C',(select id from public.production_lines where code='L03'));
insert into public.products (code,name,unit,standard_cycle_time_sec) values
 ('P001','ชิ้นส่วนฝาครอบ','ชิ้น',30),
 ('P002','ชุดประกอบมอเตอร์','ชุด',45),
 ('P003','กล่องบรรจุสำเร็จ','กล่อง',20);
insert into public.defect_types (code,name,category) values
 ('D01','ผิวงานเป็นรอย','คุณภาพผิว'),
 ('D02','ขนาดไม่ได้มาตรฐาน','มิติ'),
 ('D03','ประกอบไม่แน่น','การประกอบ'),
 ('D04','ปนเปื้อน/สกปรก','ความสะอาด');
insert into public.downtime_reasons (code,name,category) values
 ('DT01','เครื่องจักรเสีย','Breakdown'),
 ('DT02','เปลี่ยนรุ่นการผลิต','Changeover'),
 ('DT03','ขาดวัตถุดิบ','Material'),
 ('DT04','บำรุงรักษาตามแผน','Planned Maintenance'),
 ('DT05','รอคำสั่งผลิต','Waiting');

-- ===== SEED KPI RECORDS (demo) =====
insert into public.kpi_records
 (prod_date, shift_id, line_id, machine_id, product_id, work_order, planned_minutes,
  target_qty, actual_qty, good_qty, defect_qty, scrap_qty, rework_qty, raw_material_qty,
  downtime_minutes, manpower, cycle_time_sec, remark, status, submitted_at, approved_at)
select
  (current_date - (g % 14))::date,
  (select id from public.shifts where code = (array['A','B','C'])[1 + (g % 3)]),
  (select id from public.production_lines where code = (array['L01','L02','L03'])[1 + (g % 3)]),
  (select id from public.machines where code = (array['M01','M02','M03'])[1 + (g % 3)]),
  (select id from public.products where code = (array['P001','P002','P003'])[1 + (g % 3)]),
  'WO-' || to_char(current_date - (g % 14), 'YYYYMMDD') || '-' || lpad(g::text, 2, '0'),
  480,
  1000, 880 + (g * 7) % 140, 830 + (g * 5) % 120, 20 + (g * 3) % 40,
  5 + (g % 10), 3 + (g % 8), 1000 + (g % 50),
  15 + (g * 4) % 60, 8 + (g % 4), 30,
  case when g % 5 = 0 then 'เครื่องจักรหยุดระหว่างกะ' else null end,
  (array['approved','approved','approved','pending','draft'])[1 + (g % 5)]::public.kpi_status,
  now() - (g || ' hours')::interval,
  case when g % 5 < 3 then now() - (g || ' hours')::interval else null end
from generate_series(1, 45) as g;

insert into public.kpi_downtimes (record_id, reason_id, minutes)
select r.id, (select id from public.downtime_reasons where code = (array['DT01','DT02','DT03','DT04','DT05'])[1 + (abs(hashtext(r.id::text)) % 5)]), r.downtime_minutes
from public.kpi_records r;

insert into public.kpi_defects (record_id, defect_type_id, qty)
select r.id, (select id from public.defect_types where code = (array['D01','D02','D03','D04'])[1 + (abs(hashtext(r.id::text)) % 4)]), r.defect_qty
from public.kpi_records r;