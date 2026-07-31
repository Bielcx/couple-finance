import { Check, Pencil, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  buttonClass,
  daysUntilDue,
  formatCurrency,
  inputClass,
  monthLabel,
  resolveMonthRef,
  resolvePersonId,
} from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import { MonthNav } from "@/components/month-nav";
import { PersonNav } from "@/components/person-nav";
import { SummaryBar } from "@/components/summary-bar";
import {
  createFixedExpense,
  deactivateFixedExpense,
  togglePayment,
  updateFixedExpense,
} from "./actions";
import type { Category, FixedExpense, FixedExpensePayment, Profile } from "@/lib/types";

export default async function GastosFixosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; quem?: string }>;
}) {
  const { mes, quem } = await searchParams;
  const supabase = await createClient();
  const monthRef = resolveMonthRef(mes);

  const [{ data: fixedExpenses }, { data: payments }, { data: categories }, { data: profiles }] =
    await Promise.all([
      supabase.from("fixed_expenses").select("*").eq("active", true).order("due_day"),
      supabase.from("fixed_expense_payments").select("*").eq("month_ref", monthRef),
      supabase.from("categories").select("*").in("kind", ["fixed"]),
      supabase.from("profiles").select("*").order("created_at"),
    ]);

  const allPayments = (payments ?? []) as FixedExpensePayment[];
  const allCategories = (categories ?? []) as Category[];
  const allProfiles = (profiles ?? []) as Profile[];
  const personId = resolvePersonId(quem, allProfiles);

  // ponytail: filtra em memória — são poucos gastos fixos
  const allFixed = ((fixedExpenses ?? []) as FixedExpense[]).filter(
    (f) => !personId || f.responsible_id === personId
  );

  const rows = allFixed.map((f) => {
    const payment = allPayments.find((p) => p.fixed_expense_id === f.id);
    return {
      expense: f,
      amount: payment?.amount_override ?? f.amount,
      paid: payment?.paid ?? false,
      days: daysUntilDue(f.due_day, monthRef),
      category: allCategories.find((c) => c.id === f.category_id),
      responsible: allProfiles.find((p) => p.id === f.responsible_id),
    };
  });

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const paidRows = rows.filter((r) => r.paid);
  const paidTotal = paidRows.reduce((sum, r) => sum + r.amount, 0);

  const unpaid = rows.filter((r) => !r.paid);
  const groups = [
    { title: "Atrasado", rows: unpaid.filter((r) => r.days !== null && r.days < 0), urgent: true },
    {
      title: "Vence essa semana",
      rows: unpaid.filter((r) => r.days !== null && r.days >= 0 && r.days <= 7),
      urgent: true,
    },
    { title: "A pagar", rows: unpaid.filter((r) => r.days === null || r.days > 7), urgent: false },
    { title: "Pagos", rows: paidRows, urgent: false },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gastos Fixos</h1>
          <p className="text-sm text-muted capitalize">
            {monthLabel(monthRef)} — aluguel, internet, assinaturas...
          </p>
        </div>
        <MonthNav month={monthRef} basePath="/gastos-fixos" person={personId} />
      </div>

      <PersonNav
        profiles={allProfiles}
        person={personId}
        month={monthRef}
        basePath="/gastos-fixos"
      />

      <SummaryBar
        total={total}
        done={paidTotal}
        doneCount={paidRows.length}
        totalCount={rows.length}
        doneLabel="Já pago"
        pendingLabel="Falta pagar"
        tone="expense"
      />

      {/* ponytail: <details> nativo em vez de modal com estado */}
      <details className="group rounded-3xl border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-medium text-muted transition hover:text-white">
          <Plus className="h-4 w-4 transition group-open:rotate-45" />
          Novo gasto fixo
        </summary>
        <form
          action={createFixedExpense}
          className="grid grid-cols-1 gap-3 border-t border-border p-5 sm:grid-cols-2 md:grid-cols-3"
        >
          <ExpenseFields categories={allCategories} profiles={allProfiles} />
          <button type="submit" className={buttonClass}>
            Adicionar
          </button>
        </form>
      </details>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted/70">
          {personId
            ? `Nenhum gasto fixo sob responsabilidade de ${
                allProfiles.find((p) => p.id === personId)?.name
              }.`
            : "Nenhum gasto fixo cadastrado ainda."}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.title} className="flex flex-col gap-2">
            <h2
              className={`px-1 text-xs font-medium uppercase tracking-wide ${
                group.urgent ? "text-expense" : "text-muted"
              }`}
            >
              {group.title} · {group.rows.length}
            </h2>

            <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
              {group.rows.map((row, i) => (
                <li
                  key={row.expense.id}
                  className="fade-in-up p-4"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        <CategoryIcon icon={row.category?.icon} className="h-4 w-4 text-muted" />
                        {row.expense.name}
                      </p>
                      <p className="text-xs text-muted">
                        {dueLabel(row.expense.due_day, row.days, row.paid)} ·{" "}
                        {row.responsible?.name ?? "sem responsável"} ·{" "}
                        {splitLabel(row.expense.split_type, row.expense.split_percent_a)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(row.amount)}</span>

                      <form
                        action={togglePayment.bind(
                          null,
                          row.expense.id,
                          row.responsible?.id ?? allProfiles[0]?.id ?? "",
                          row.paid,
                          monthRef
                        )}
                      >
                        <button
                          type="submit"
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                            row.paid
                              ? "bg-income/20 text-income hover:bg-income/30"
                              : "bg-border text-white/80 hover:bg-surface-hover"
                          }`}
                        >
                          {row.paid && <Check className="h-3.5 w-3.5" />}
                          {row.paid ? "Pago" : "Marcar como pago"}
                        </button>
                      </form>

                      <form action={deactivateFixedExpense.bind(null, row.expense.id)}>
                        <button
                          type="submit"
                          className="rounded-full p-1.5 text-muted/70 transition hover:text-expense active:scale-90"
                          title="Desativar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>

                  <details className="mt-2">
                    <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-xs text-muted/60 transition hover:text-white">
                      <Pencil className="h-3 w-3" />
                      Editar
                    </summary>
                    <form
                      action={updateFixedExpense.bind(null, row.expense.id)}
                      className="mt-3 grid grid-cols-1 gap-3 rounded-2xl bg-background/50 p-4 sm:grid-cols-2 md:grid-cols-3"
                    >
                      <ExpenseFields
                        categories={allCategories}
                        profiles={allProfiles}
                        expense={row.expense}
                      />
                      <button type="submit" className={buttonClass}>
                        Salvar
                      </button>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

/** Campos compartilhados entre criar e editar. */
function ExpenseFields({
  categories,
  profiles,
  expense,
}: {
  categories: Category[];
  profiles: Profile[];
  expense?: FixedExpense;
}) {
  return (
    <>
      <input
        name="name"
        required
        defaultValue={expense?.name}
        placeholder="Nome (ex: Aluguel)"
        className={inputClass}
      />
      <input
        name="amount"
        type="number"
        step="0.01"
        required
        defaultValue={expense?.amount}
        placeholder="Valor"
        className={inputClass}
      />
      <input
        name="due_day"
        type="number"
        min={1}
        max={31}
        required
        defaultValue={expense?.due_day}
        placeholder="Dia venc."
        className={inputClass}
      />
      <select name="category_id" defaultValue={expense?.category_id ?? ""} className={inputClass}>
        <option value="">Categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="responsible_id"
        defaultValue={expense?.responsible_id ?? ""}
        className={inputClass}
      >
        <option value="">Responsável</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select name="split_type" defaultValue={expense?.split_type ?? "50_50"} className={inputClass}>
        <option value="50_50">Dividir 50/50</option>
        <option value="integral">Quem paga assume 100%</option>
        <option value="custom">Percentual customizado</option>
      </select>
      <input
        name="split_percent_a"
        type="number"
        min={0}
        max={100}
        defaultValue={expense?.split_percent_a ?? ""}
        placeholder="% pessoa 1 (se custom)"
        className={inputClass}
      />
    </>
  );
}

function dueLabel(dueDay: number, days: number | null, paid: boolean): string {
  if (paid || days === null) return `Vence dia ${dueDay}`;
  if (days < 0) return `Venceu há ${-days} ${-days === 1 ? "dia" : "dias"}`;
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  return `Vence em ${days} dias`;
}

function splitLabel(splitType: string, percentA: number | null) {
  if (splitType === "50_50") return "50/50";
  if (splitType === "integral") return "100% de quem pagou";
  return `${percentA ?? 50}% / ${100 - (percentA ?? 50)}%`;
}
