import { createClient } from "@/lib/supabase/server";
import {
  calculateBalance,
  currentMonthRef,
  formatCurrency,
  monthLabel,
  monthRangeBounds,
  pastMonthRefs,
  shortMonthLabel,
} from "@/lib/utils";
import { BalanceChart, type BalancePoint } from "@/components/balance-chart";
import type {
  Category,
  FixedExpense,
  FixedExpensePayment,
  FixedIncome,
  FixedIncomeReceipt,
  Profile,
  Transaction,
} from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const monthRef = currentMonthRef();
  const { start: monthStart, end: monthEnd } = monthRangeBounds(monthRef);
  const historyMonths = pastMonthRefs(5); // 5 meses anteriores + o atual = 6 pontos no gráfico
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
      <div>
        <h1 className="text-2xl font-semibold capitalize">{monthLabel(monthRef)}</h1>
        <p className="text-sm text-slate-400">Visão geral das finanças do casal</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="Receitas" value={formatCurrency(totalIncome)} tone="income" />
        <Card label="Gastos fixos" value={formatCurrency(totalFixed)} tone="expense" />
        <Card label="Gastos variáveis" value={formatCurrency(totalVariable)} tone="expense" />
        <Card
          label="Saldo do mês"
          value={formatCurrency(saldo)}
          tone={saldo >= 0 ? "income" : "expense"}
        />
      </div>

      {allProfiles.length === 2 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-sm font-medium text-slate-400">Saldo entre vocês</h2>
          {balance === 0 ? (
            <p className="text-lg font-semibold">Contas equilibradas 🎉</p>
          ) : balance > 0 ? (
            <p className="text-lg font-semibold">
              {allProfiles[1].name} deve {formatCurrency(balance)} para {allProfiles[0].name}
            </p>
          ) : (
            <p className="text-lg font-semibold">
              {allProfiles[0].name} deve {formatCurrency(-balance)} para {allProfiles[1].name}
            </p>
          )}

          <p className="mb-2 mt-6 text-xs text-slate-500">
            Evolução do saldo nos últimos 6 meses — a linha tracejada é o ponto de
            equilíbrio (ninguém deve nada para ninguém)
          </p>
          <BalanceChart data={balanceHistory} />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400">Gastos por categoria</h2>
          <span className="text-xs text-slate-500">
            {paidCount}/{allFixed.length} gastos fixos pagos
          </span>
        </div>

        {categoryRows.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum gasto lançado neste mês ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {categoryRows.map(({ category, total }) => (
              <li key={category?.id ?? "sem-categoria"} className="flex items-center justify-between text-sm">
                <span>
                  {category?.icon ?? "❓"} {category?.name ?? "Sem categoria"}
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
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone === "income" ? "text-income" : "text-expense"}`}>
        {value}
      </p>
    </div>
  );
}
