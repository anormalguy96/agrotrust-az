begin;

alter table public.passports
  add column if not exists created_by uuid default auth.uid();

alter table public.passports
  add column if not exists is_published boolean not null default false;

alter table public.passports enable row level security;

-- 1) Ensure tables exist (idempotent)
create table if not exists public.passport_agrochemicals (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete cascade,
  kind text not null check (kind in ('pesticide', 'fertilizer')),
  product_name text not null,
  active_ingredient text,
  concentration text,
  dose numeric,
  dose_unit text,
  application_date date,
  method text,
  phi_days int,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.laboratories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  city text,
  accreditation text,
  website text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.passport_lab_reports (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete cascade,
  laboratory_id uuid references public.laboratories(id) on delete set null,
  sample_code text not null,
  sample_date date,
  report_date date,
  report_file_path text,
  report_sha256 text,
  passed boolean,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.passport_lab_results (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.passport_lab_reports(id) on delete cascade,
  analyte text not null,
  value numeric,
  unit text,
  limit_value numeric,
  limit_unit text,
  status text not null check (status in ('pass', 'fail', 'unknown')),
  created_at timestamptz not null default now()
);

-- 2) Enable RLS on child tables
alter table public.passport_agrochemicals enable row level security;
alter table public.passport_lab_reports enable row level security;
alter table public.passport_lab_results enable row level security;

-- 3) Drop any old/broken policies (safe even if missing)
drop policy if exists "agrochemicals_owner_rw" on public.passport_agrochemicals;
drop policy if exists "agrochemicals_public_read" on public.passport_agrochemicals;

drop policy if exists "lab_reports_owner_rw" on public.passport_lab_reports;
drop policy if exists "lab_reports_public_read" on public.passport_lab_reports;

drop policy if exists "lab_results_owner_rw" on public.passport_lab_results;
drop policy if exists "lab_results_public_read" on public.passport_lab_results;

drop policy if exists "lab_results_read_by_report_access" on public.passport_lab_results;

drop policy if exists "passports_owner_rw" on public.passports;
drop policy if exists "passports_public_read" on public.passports;

-- 4) Recreate correct policies

-- passports: owner RW, public read if published
create policy "passports_owner_rw"
on public.passports
for all
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "passports_public_read"
on public.passports
for select
to anon, authenticated
using (is_published = true);

-- agrochemicals: inherit from passport
create policy "agrochemicals_owner_rw"
on public.passport_agrochemicals
for all
to authenticated
using (
  exists (
    select 1 from public.passports p
    where p.id = passport_agrochemicals.passport_id
      and p.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.passports p
    where p.id = passport_agrochemicals.passport_id
      and p.created_by = auth.uid()
  )
);

create policy "agrochemicals_public_read"
on public.passport_agrochemicals
for select
to anon, authenticated
using (
  exists (
    select 1 from public.passports p
    where p.id = passport_agrochemicals.passport_id
      and p.is_published = true
  )
);

-- lab reports: inherit from passport
create policy "lab_reports_owner_rw"
on public.passport_lab_reports
for all
to authenticated
using (
  exists (
    select 1 from public.passports p
    where p.id = passport_lab_reports.passport_id
      and p.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.passports p
    where p.id = passport_lab_reports.passport_id
      and p.created_by = auth.uid()
  )
);

create policy "lab_reports_public_read"
on public.passport_lab_reports
for select
to anon, authenticated
using (
  exists (
    select 1 from public.passports p
    where p.id = passport_lab_reports.passport_id
      and p.is_published = true
  )
);

-- lab results: inherit from report -> passport
create policy "lab_results_owner_rw"
on public.passport_lab_results
for all
to authenticated
using (
  exists (
    select 1
    from public.passport_lab_reports r
    join public.passports p on p.id = r.passport_id
    where r.id = passport_lab_results.report_id
      and p.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.passport_lab_reports r
    join public.passports p on p.id = r.passport_id
    where r.id = passport_lab_results.report_id
      and p.created_by = auth.uid()
  )
);

create policy "lab_results_public_read"
on public.passport_lab_results
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.passport_lab_reports r
    join public.passports p on p.id = r.passport_id
    where r.id = passport_lab_results.report_id
      and p.is_published = true
  )
);

commit;