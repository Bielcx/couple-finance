-- Couple Finance — viagens (custos de uma viagem específica, com acerto no final)
-- Rode este arquivo no SQL Editor do Supabase depois do 0002_fixed_incomes.sql

-- ==========================================================
-- trips: uma viagem (ex: "Praia — Novembro")
-- ==========================================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text,
  start_date date,
  end_date date,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

-- ==========================================================
-- trip_expenses: cada gasto lançado dentro de uma viagem
-- ==========================================================
create table if not exists trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_by uuid not null references profiles(id),
  split_type text not null default '50_50' check (split_type in ('50_50', 'integral', 'custom')),
  split_percent_a numeric(5, 2),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_trip_expenses_trip on trip_expenses (trip_id);

alter table trips enable row level security;
alter table trip_expenses enable row level security;

create policy "authenticated full access trips" on trips for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access trip_expenses" on trip_expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
