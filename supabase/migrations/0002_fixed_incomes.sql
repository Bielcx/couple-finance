-- Couple Finance — renda fixa recorrente (salário e afins)
-- Rode este arquivo no SQL Editor do Supabase depois do 0001_init.sql

-- ==========================================================
-- fixed_incomes: modelo de renda fixa mensal (salário, aluguel recebido...)
-- ==========================================================
create table if not exists fixed_incomes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid references categories(id),
  profile_id uuid not null references profiles(id), -- quem recebe
  receive_day int not null check (receive_day between 1 and 31),
  active bool not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- ==========================================================
-- fixed_income_receipts: status de recebimento de cada renda fixa, por mês
-- ==========================================================
create table if not exists fixed_income_receipts (
  id uuid primary key default gen_random_uuid(),
  fixed_income_id uuid not null references fixed_incomes(id) on delete cascade,
  month_ref date not null, -- sempre dia 1 do mês, ex: 2026-07-01
  received bool not null default false,
  received_at timestamptz,
  amount_override numeric(12, 2), -- se o valor variou naquele mês (ex: 13º, bônus)
  unique (fixed_income_id, month_ref)
);

create index if not exists idx_fixed_income_receipts_month on fixed_income_receipts (month_ref);

alter table fixed_incomes enable row level security;
alter table fixed_income_receipts enable row level security;

create policy "authenticated full access fixed_incomes" on fixed_incomes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access fixed_income_receipts" on fixed_income_receipts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
