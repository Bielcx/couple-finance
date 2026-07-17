# Couple Finance 💸

App pessoal para controlar as finanças do casal: gastos fixos mensais, gastos
variáveis do dia a dia, divisão de contas e visão geral do mês.

## Stack

- **Next.js 15** (App Router, Server Actions) + TypeScript + Tailwind
- **Supabase** — Postgres + Auth (login simples com e-mail/senha)
- **Recharts** — gráfico de evolução do saldo
- Deploy na **Vercel**

## Modelo de dados

- `profiles` — uma linha por pessoa do casal (criada automaticamente no signup)
- `categories` — categorias de gasto/receita (moradia, mercado, lazer...)
- `fixed_expenses` — gastos fixos recorrentes (aluguel, internet, assinaturas), com dia de
  vencimento e forma de divisão
- `fixed_expense_payments` — status de pagamento de cada gasto fixo, por mês (permite
  marcar como pago e registrar valor diferente do padrão, ex: conta de luz que varia)
- `fixed_incomes` — renda fixa recorrente (salário e afins), com dia de recebimento
- `fixed_income_receipts` — status de recebimento de cada renda fixa, por mês
- `transactions` — lançamentos avulsos (gastos variáveis e receitas)
- `trips` — uma viagem específica (ex: "Praia — Novembro"), com status aberta/fechada
- `trip_expenses` — gastos lançados dentro de uma viagem, para acertar contas no final

Divisão de gastos (`split_type`, usada em `fixed_expenses`, `transactions` e
`trip_expenses`): `50_50` (metade pra cada um), `integral` (quem pagou assume o valor
todo, sem dividir) ou `custom` (percentual definido — o campo "% pessoa 1" ao lado
define quanto da conta a primeira pessoa cadastrada paga; o resto fica com a segunda).

## Setup

### 1. Criar projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e rode, nessa ordem, o conteúdo de cada arquivo em
   `supabase/migrations/` (0001, depois 0002, depois 0003...)
3. Em **Authentication → Sign In / Providers**, confirme que "Email" está habilitado
4. Em **Authentication → Users**, crie manualmente as duas contas (a sua e a do seu par) —
   não há cadastro público no app. O trigger da migration cria o `profile`
   automaticamente para cada usuário criado.
5. Copie a **Project URL** e a **anon public key** em **Settings → API**

### 2. Rodar localmente

```bash
cp .env.example .env.local
# preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Acesse `http://localhost:3000` e faça login com uma das contas criadas no Supabase.

### 3. Deploy na Vercel

1. Importe o repositório `Bielcx/couple-finance` na Vercel
2. Configure as env vars `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy — sem configuração adicional necessária

## Estrutura

```
app/
  login/              → tela de login + server actions de auth
  (app)/
    dashboard/         → totais do mês, saldo entre o casal, gráfico de evolução, gastos por categoria
    renda-fixa/        → CRUD de renda recorrente (salário) + marcar recebido/pendente por mês
    gastos-fixos/       → CRUD de gastos fixos + marcar pago/pendente por mês
    transacoes/        → lançamentos de gastos variáveis e receitas avulsas
    viagens/           → lista de viagens + criação
    viagens/[id]/      → gastos de uma viagem específica + acerto de contas
components/
  nav.tsx              → navegação principal
  balance-chart.tsx    → gráfico de linha do saldo (recharts)
lib/
  supabase/            → clientes Supabase (browser, server, middleware)
  types.ts             → tipos compartilhados
  utils.ts             → formatação, cálculo de divisão, saldo entre o casal e histórico mensal
supabase/migrations/    → schema do banco (rodar em ordem: 0001, 0002, 0003...)
```

## Roadmap (próximos passos sugeridos)

- [ ] Edição de gastos fixos e transações já criados (hoje só cria/exclui)
- [ ] Metas de gasto por categoria com alerta ao ultrapassar
- [ ] Anexar comprovante/nota fiscal a uma transação (Supabase Storage)
- [ ] Exportar relatório mensal ou de viagem (PDF/CSV)
- [ ] PWA / instalar no celular

## Por que não achei referência pronta?

Ferramentas de finanças de casal geralmente são apps genéricos de split de contas
(tipo Splitwise) ou apps de orçamento pessoal sem conceito de "duas pessoas, um
orçamento". Esse projeto assume o caso específico: vocês dois compartilham gastos
fixos e variáveis, cada um pode pagar por qualquer coisa, e o app calcula quem deve
o quê no fim do mês — sem precisar replicar cada lançamento duas vezes.
