import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, formatCurrency } from "@/lib/utils";
import { createTransaction, deleteTransaction } from "./actions";
import type { Category, Profile, Transaction } from "@/lib/types";

export default async function TransacoesPage() {
  const supabase = await createClient();
  const monthRef = currentMonthRef();
  const [year, month] = monthRef.split("-").map(Number);
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const [{ data: transactions }, { data: categories }, { data: profiles }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("occurred_on", monthRef)
      .lt("occurred_on", monthEnd)
      .order("occurred_on", { ascending: false }),
    supabase.from("categories").select("*"),
    supabase.from("profiles").select("*").order("created_at"),
  ]);

  const allTransactions = (transactions ?? []) as Transaction[];
  const allCategories = (categories ?? []) as Category[];
  const allProfiles = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Transações</h1>
        <p className="text-sm text-slate-400">Gastos variáveis e receitas do mês</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-400">Novo lançamento</h2>
        <form action={createTransaction} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <select
            name="type"
            defaultValue="expense"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="expense">Gasto</option>
            <option value="income">Receita</option>
          </select>
          <input
            name="description"
            required
            placeholder="Descrição"
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-1"
          />
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="Valor"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            name="occurred_on"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <select
            name="category_id"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Categoria</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <select
            name="paid_by"
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Quem pagou / recebeu</option>
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            name="split_type"
            defaultValue="50_50"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="50_50">Dividir 50/50</option>
            <option value="integral">Só quem pagou (não divide)</option>
            <option value="custom">Percentual customizado</option>
          </select>
          <input
            name="split_percent_a"
            type="number"
            min={0}
            max={100}
            placeholder="% pessoa 1 (se custom)"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:col-span-1"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {allTransactions.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhuma transação lançada neste mês ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {allTransactions.map((t) => {
              const category = allCategories.find((c) => c.id === t.category_id);
              const person = allProfiles.find((p) => p.id === t.paid_by);

              return (
                <li key={t.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">
                      {category?.icon ?? "💰"} {t.description}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.occurred_on).toLocaleDateString("pt-BR")} · {person?.name ?? "?"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        t.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>

                    <form action={deleteTransaction.bind(null, t.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-expense"
                        title="Excluir"
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
