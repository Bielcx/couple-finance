-- Couple Finance — acertos de conta entre o casal
-- Rode este arquivo no SQL Editor do Supabase depois do 0006.
--
-- Até aqui o "fulano deve X para beltrano" era derivado só dos gastos: nunca
-- zerava, porque não havia onde registrar a transferência que quita a dívida.
-- Um acerto pertence ao mês que está sendo quitado (mesma ideia do month_ref
-- de fixed_expense_payments), não à data em que o PIX caiu.

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  month_ref date not null, -- sempre dia 1 do mês, ex: 2026-07-01
  paid_by uuid not null references profiles(id), -- quem transferiu
  amount numeric(12, 2) not null check (amount > 0),
  settled_at timestamptz not null default now()
);

-- sem unique(month_ref): o casal pode acertar em parcelas dentro do mesmo mês
create index if not exists idx_settlements_month on settlements (month_ref);

alter table settlements enable row level security;

create policy "authenticated full access settlements" on settlements
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
