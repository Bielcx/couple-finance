import { createClient } from "@/lib/supabase/server";
import {
  calculateBalance,
  formatCurrency,
  monthLabel,
  monthRangeBounds,
  pastMonthRefs,
  resolveMonthRef,
  shortMonthLabel,
} from "@/lib/utils";
import { PartyPopper } from "lucide-react";
import { AnimatedNumber } from "@/components/animated-number";
import { BalanceChart, type BalancePoint } from "@/components/balance-chart";
import { CategoryIcon } from "@/components/category-icon";
import { MonthNav } from "@/components/month-nav";
import type {
  Category,
  FixedExpense,
  FixedExpensePayment,
  FixedIncome,
  FixedIncomeReceipt,
  Profile,
  Transaction,
} from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const supabase = await createClient();
  const monthRef = resolveMonthRef(mes);
  const { start: monthStart, end: monthEnd } = monthRangeBounds(monthRef);
  const historyMonths = pastMonthRefs(5, monthRef); // 5 meses anteriores + o selecionado = 6 pontos no gráfico
  const historyStart = historyMonths[0];

  const [
    { data: profiles },
    { data: categories },
    { data: fixedExpenses },
    { data: payments },
    { data: transactions },
    { data: fixedIncomes },
    { data: incomeReceipts },
    { data: allFixedExpensesEver },
    { data: paymentsHistory },
    { data: transactionsHistory },
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at"),
    supabase.from("categories").select("*"),
    supabase.from("fixed_expenses").select("*").eq("active", true),
    supabase.from("fixed_expense_payments").select("*").eq("month_ref", monthRef),
    supabase
      .from("transactions")
      .select("*")
      .gte("occurred_on", monthStart)
      .lt("occurred_on", monthEnd),
    supabase.from("fixed_incomes").select("*").eq("active", true),
    supabase.from("fixed_income_receipts").select("*").eq("month_ref", monthRef),
    supabase.from("fixed_expenses").select("*"),
    supabase.from("fixed_expense_payments").select("*").gte("month_ref", historyStart).lt("month_ref", monthRef),
    supabase
      .from("transactions")
      .select("*")
      .eq("type", "expense")
      .gte("occurred_on", historyStart)
      .lt("occurred_on", monthStart),
  ]);

  const allProfiles = (profiles ?? []) as Profile[];
  const allCategories = (categories ?? []) as Category[];
  const allFixed = (fixedExpenses ?? []) as FixedExpense[];
  const allPayments = (payments ?? []) as FixedExpensePayment[];
  const allTransactions = (transactions ?? []) as Transaction[];
  const allFixedIncomes = (fixedIncomes ?? []) as FixedIncome[];
  const allIncomeReceipts = (incomeReceipts ?? []) as FixedIncomeReceipt[];

  const totalFixed = allFixed.reduce((sum, f) => {
    const override = allPayments.find((p) => p.fixed_expense_id === f.id)?.amount_override;
    return sum + (override ?? f.amount);
  }, 0);

  const totalVariable = allTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransactionIncome = allTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFixedIncome = allFixedIncomes.reduce((sum, income) => {
    const override = allIncomeReceipts.find((r) => r.fixed_income_id === income.id)?.amount_override;
    return sum + (override ?? income.amount);
  }, 0);

  const totalIncome = totalTransactionIncome + totalFixedIncome;

  const totalExpenses = totalFixed + totalVariable;
  const saldo = totalIncome - totalExpenses;

  const paidCount = allPayments.filter((p) => p.paid).length;

  // saldo entre o casal (considera gastos fixos + transações do mês)
  let balance = 0;
  if (allProfiles.length === 2) {
    const [profileA, profileB] = allProfiles;

    const fixedEntries = allFixed.map((f) => {
      const payment = allPayments.find((p) => p.fixed_expense_id === f.id);
      return {
        amount: payment?.amount_override ?? f.amount,
        paid_by: payment?.paid_by ?? f.responsible_id ?? profileA.id,
        split_type: f.split_type,
        split_percent_a: f.split_percent_a,
      };
    });

    const variableEntries = allTransactions
      .filter((t) => t.type === "expense")
      .map((t) => ({
        amount: t.amount,
        paid_by: t.paid_by,
        split_type: t.split_type,
        split_percent_a: t.split_percent_a,
      }));

    balance = calculateBalance([...fixedEntries, ...variableEntries], profileA, profileB);
  }

  // histórico de saldo (últimos 6 meses, incluindo o atual) para o gráfico
  let balanceHistory: BalancePoint[] = [];
  if (allProfiles.length === 2) {
    const [profileA, profileB] = allProfiles;
    const allFixedEver = (allFixedExpensesEver ?? []) as FixedExpense[];
    const allPaymentsHistory = (paymentsHistory ?? []) as FixedExpensePayment[];
    const allTransactionsHistory = (transactionsHistory ?? []) as Transaction[];

    const pastPoints = historyMonths.map((m) => {
      const { start, end } = monthRangeBounds(m);

      const fixedEntries = allPaymentsHistory
        .filter((p) => p.month_ref === m && p.paid_by)
        .map((p) => {
          const fe = allFixedEver.find((f) => f.id === p.fixed_expense_id);
          return {
            amount: p.amount_override ?? fe?.amount ?? 0,
            paid_by: p.paid_by as string,
            split_type: fe?.split_type ?? "50_50",
            split_percent_a: fe?.split_percent_a ?? null,
          };
        });

      const variableEntries = allTransactionsHistory
        .filter((t) => t.occurred_on >= start && t.occurred_on < end)
        .map((t) => ({
          amount: t.amount,
          paid_by: t.paid_by,
          split_type: t.split_type,
          split_percent_a: t.split_percent_a,
        }));

      return {
        month: shortMonthLabel(m),
        saldo: calculateBalance([...fixedEntries, ...variableEntries], profileA, profileB),
      };
    });

    balanceHistory = [...pastPoints, { month: shortMonthLabel(monthRef), saldo: balance }];
  }

  // total por categoria (fixos + variáveis)
  const byCategory = new Map<string, number>();
  for (const f of allFixed) {
    const payment = allPayments.find((p) => p.fixed_expense_id === f.id);
    const amount = payment?.amount_override ?? f.amount;
    const key = f.category_id ?? "sem-categoria";
    byCategory.set(key, (byCategory.get(key) ?? 0) + amount);
  }
  for (const t of allTransactions.filter((t) => t.type === "expense")) {
    const key = t.category_id ?? "sem-categoria";
    byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
  }

  const categoryRows = Array.from(byCategory.entries())
    .map(([categoryId, total]) => ({
      category: allCategories.find((c) => c.id === categoryId),
      total,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold capitalize">{monthLabel(monthRef)}</h1>
          <p className="text-sm text-muted">Visão geral das finanças do casal</p>
        </div>
        <MonthNav month={monthRef} basePath="/dashboard" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card index={0} label="Receitas" value={totalIncome} tone="income" />
        <Card index={1} label="Gastos fixos" value={totalFixed} tone="expense" />
        <Card index={2} label="Gastos variáveis" value={totalVariable} tone="expense" />
        <Card index={3} label="Saldo do mês" value={saldo} tone={saldo >= 0 ? "income" : "expense"} />
      </div>

      {allProfiles.length === 2 && (
        <div className="fade-in-up rounded-3xl border border-border bg-surface p-5" style={{ animationDelay: "160ms" }}>
          <h2 className="mb-2 text-sm font-medium text-muted">Saldo entre vocês</h2>
          {balance === 0 ? (
            <p className="flex items-center gap-2 text-lg font-semibold">
              <PartyPopper className="h-5 w-5 text-income" />
              Contas equilibradas
            </p>
          ) : balance > 0 ? (
            <p className="text-lg font-semibold">
              {allProfiles[1].name} deve <AnimatedNumber value={balance} /> para {allProfiles[0].name}
            </p>
          ) : (
            <p className="text-lg font-semibold">
              {allProfiles[0].name} deve <AnimatedNumber value={-balance} /> para {allProfiles[1].name}
            </p>
          )}

          <p className="mb-2 mt-6 text-xs text-muted/70">
            Evolução do saldo até <span className="capitalize">{monthLabel(monthRef)}</span> — o ponto em
            destaque é o mês selecionado, a linha tracejada é o equilíbrio
          </p>
          <BalanceChart data={balanceHistory} selectedMonth={shortMonthLabel(monthRef)} />
        </div>
      )}

      <div className="fade-in-up rounded-3xl border border-border bg-surface p-5" style={{ animationDelay: "220ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Gastos por categoria</h2>
          <span className="text-xs text-muted/70">
            {paidCount}/{allFixed.length} gastos fixos pagos
          </span>
        </div>

        {categoryRows.length === 0 ? (
          <p className="text-sm text-muted/70">Nenhum gasto lançado neste mês ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {categoryRows.map(({ category, total }, i) => (
              <li
                key={category?.id ?? "sem-categoria"}
                className="fade-in-up flex items-center justify-between text-sm"
                style={{ animationDelay: `${260 + i * 40}ms` }}
              >
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={category?.icon} className="h-4 w-4 text-muted" />
                  {category?.name ?? "Sem categoria"}
                </span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({
  index,
  label,
  value,
  tone,
}: {
  index: number;
  label: string;
  value: number;
  tone: "income" | "expense";
}) {
  return (
    <div
      className="fade-in-up rounded-3xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "income" ? "text-income" : "text-expense"}`}>
        <AnimatedNumber value={value} />
      </p>
    </div>
  );
}
