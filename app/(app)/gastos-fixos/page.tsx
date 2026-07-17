import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, formatCurrency } from "@/lib/utils";
import { createFixedExpense, deactivateFixedExpense, togglePayment } from "./actions";
import type { Category, FixedExpense, FixedExpensePayment, Profile } from "@/lib/types";

export default async function GastosFixosPage() {
  const supabase = await createClient();
  const monthRef = currentMonthRef();

  const [{ data: fixedExpenses }, { data: payments }, { data: categories }, { data: profiles }] =
    await Promise.all([
      supabase.from("fixed_expenses").select("*").eq("active", true).order("due_day"),
      supabase.from("fixed_expense_payments").select("*").eq("month_ref", monthRef),
      supabase.from("categories").select("*").in("kind", ["fixed"]),
      supabase.from("profiles").select("*").order("created_at"),
    ]);

  const allFixed = (fixedExpenses ?? []) as FixedExpense[];
  const allPayments = (payments ?? []) as FixedExpensePayment[];
  const allCategories = (categories ?? []) as Category[];
  const allProfiles = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Gastos Fixos</h1>
        <p className="text-sm text-muted">
          Contas recorrentes do mês — aluguel, internet, assinaturas...
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Novo gasto fixo</h2>
        <form action={createFixedExpense} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <input
            name="name"
            required
            placeholder="Nome (ex: Aluguel)"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow sm:col-span-1"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="Valor"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <input
            name="due_day"
            type="number"
            min={1}
            max={31}
            required
            placeholder="Dia venc."
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <select
            name="category_id"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          >
            <option value="">Categoria</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <select
            name="responsible_id"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          >
            <option value="">Responsável</option>
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="split_type"
            defaultValue="50_50"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          >
            <option value="50_50">Dividir 50/50</option>
            <option value="integral">Quem paga assume 100%</option>
            <option value="custom">Percentual customizado</option>
          </select>
          <input
            name="split_percent_a"
            type="number"
            min={0}
            max={100}
            placeholder="% pessoa 1 (se custom)"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:bg-primary-hover sm:col-span-1"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-border bg-surface">
        {allFixed.length === 0 ? (
          <p className="p-5 text-sm text-muted/70">Nenhum gasto fixo cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {allFixed.map((f) => {
              const payment = allPayments.find((p) => p.fixed_expense_id === f.id);
              const paid = payment?.paid ?? false;
              const category = allCategories.find((c) => c.id === f.category_id);
              const responsible = allProfiles.find((p) => p.id === f.responsible_id);

              return (
                <li key={f.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {category?.icon ?? "💰"} {f.name}
                    </p>
                    <p className="text-xs text-muted">
                      Vence dia {f.due_day} · {responsible?.name ?? "sem responsável"} ·{" "}
                      {splitLabel(f.split_type, f.split_percent_a)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatCurrency(f.amount)}</span>

                    <form
                      action={togglePayment.bind(
                        null,
                        f.id,
                        responsible?.id ?? allProfiles[0]?.id ?? "",
                        paid
                      )}
                    >
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          paid
                            ? "bg-income/20 text-income hover:bg-income/30"
                            : "bg-border text-white/80 hover:bg-surface-hover"
                        }`}
                      >
                        {paid ? "Pago ✓" : "Marcar como pago"}
                      </button>
                    </form>

                    <form action={deactivateFixedExpense.bind(null, f.id)}>
                      <button
                        type="submit"
                        className="rounded-full px-2 py-1.5 text-xs text-muted/70 hover:text-expense"
                        title="Desativar"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function splitLabel(splitType: string, percentA: number | null) {
  if (splitType === "50_50") return "50/50";
  if (splitType === "integral") return "100% de quem pagou";
  return `${percentA ?? 50}% / ${100 - (percentA ?? 50)}%`;
}
