-- Couple Finance — schema inicial
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`)

create extension if not exists "pgcrypto";

-- ==========================================================
-- profiles: um registro por pessoa do casal, ligado ao auth.users
-- ==========================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1', -- cor usada nos gráficos/avatares
  created_at timestamptz not null default now()
);

-- ==========================================================
-- categories: categorias de gasto/receita (compartilhadas pelo casal)
-- ==========================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default '💰',
  color text not null default '#94a3b8',
  kind text not null check (kind in ('fixed', 'variable', 'income')),
  created_at timestamptz not null default now()
);

-- ==========================================================
-- fixed_expenses: modelo de gasto fixo mensal (aluguel, internet, assinaturas...)
-- ==========================================================
create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid references categories(id),
  due_day int not null check (due_day between 1 and 31),
  responsible_id uuid references profiles(id), -- quem normalmente paga/organiza
  split_type text not null default '50_50' check (split_type in ('50_50', 'integral', 'custom')),
  split_percent_a numeric(5, 2), -- % pago pelo profile "A" quando split_type = 'custom'
  active bool not null default true,
  notes text,
  created_at timestamptz not null default now()
);

-- ==========================================================
-- fixed_expense_payments: status de pagamento de cada gasto fixo, por mês
-- ==========================================================
create table if not exists fixed_expense_payments (
  id uuid primary key default gen_random_uuid(),
  fixed_expense_id uuid not null references fixed_expenses(id) on delete cascade,
  month_ref date not null, -- sempre dia 1 do mês, ex: 2026-07-01
  paid bool not null default false,
  paid_by uuid references profiles(id),
  paid_at timestamptz,
  amount_override numeric(12, 2), -- se o valor variou naquele mês (ex: conta de luz)
  unique (fixed_expense_id, month_ref)
);

-- ==========================================================
-- transactions: gastos variáveis e receitas (lançamentos avulsos)
-- ==========================================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('expense', 'income')),
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  category_id uuid references categories(id),
  paid_by uuid not null references profiles(id),
  split_type text not null default '50_50' check (split_type in ('50_50', 'integral', 'custom')),
  split_percent_a numeric(5, 2),
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_occurred_on on transactions (occurred_on);
create index if not exists idx_fixed_payments_month on fixed_expense_payments (month_ref);

-- ==========================================================
-- RLS: como são só 2 usuários (o casal) e ambos devem ver tudo,
-- a regra é simples — qualquer usuário autenticado tem acesso total.
-- ==========================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table fixed_expenses enable row level security;
alter table fixed_expense_payments enable row level security;
alter table transactions enable row level security;

create policy "authenticated read profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "user updates own profile" on profiles for update using (auth.uid() = id);
create policy "user inserts own profile" on profiles for insert with check (auth.uid() = id);

create policy "authenticated full access categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access fixed_expenses" on fixed_expenses for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access fixed_expense_payments" on fixed_expense_payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "authenticated full access transactions" on transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ==========================================================
-- trigger: cria profile automaticamente quando um usuário se cadastra
-- ==========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================
-- seed: categorias padrão
-- ==========================================================
insert into categories (name, icon, color, kind) values
  ('Moradia', '🏠', '#f97316', 'fixed'),
  ('Internet/Telefone', '📶', '#0ea5e9', 'fixed'),
  ('Assinaturas', '📺', '#8b5cf6', 'fixed'),
  ('Contas de Casa (água/luz/gás)', '💡', '#eab308', 'fixed'),
  ('Transporte', '🚗', '#14b8a6', 'variable'),
  ('Mercado', '🛒', '#22c55e', 'variable'),
  ('Delivery/Restaurante', '🍔', '#ef4444', 'variable'),
  ('Lazer', '🎉', '#ec4899', 'variable'),
  ('Saúde', '💊', '#06b6d4', 'variable'),
  ('Compras Diversas', '🛍️', '#a855f7', 'variable'),
  ('Salário', '💼', '#16a34a', 'income'),
  ('Outras Receitas', '➕', '#65a30d', 'income')
on conflict do nothing;
