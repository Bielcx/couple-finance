import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, formatCurrency } from "@/lib/utils";
import { createFixedIncome, deactivateFixedIncome, toggleReceipt } from "./actions";
import type { Category, FixedIncome, FixedIncomeReceipt, Profile } from "@/lib/types";

export default async function RendaFixaPage() {
  const supabase = await createClient();
  const monthRef = currentMonthRef();

  const [{ data: fixedIncomes }, { data: receipts }, { data: categories }, { data: profiles }] =
    await Promise.all([
      supabase.from("fixed_incomes").select("*").eq("active", true).order("receive_day"),
      supabase.from("fixed_income_receipts").select("*").eq("month_ref", monthRef),
      supabase.from("categories").select("*").in("kind", ["income"]),
      supabase.from("profiles").select("*").order("created_at"),
    ]);

  const allIncomes = (fixedIncomes ?? []) as FixedIncome[];
  const allReceipts = (receipts ?? []) as FixedIncomeReceipt[];
  const allCategories = (categories ?? []) as Category[];
  const allProfiles = (profiles ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Renda Fixa</h1>
        <p className="text-sm text-slate-400">
          Salário e outras receitas recorrentes de vocês dois
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-400">Nova renda fixa</h2>
        <form action={createFixedIncome} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input
            name="name"
            required
            placeholder="Nome (ex: Salário)"
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
            name="receive_day"
            type="number"
            min={1}
            max={31}
            required
            placeholder="Dia do recebimento"
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
            name="profile_id"
            required
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-1"
          >
            <option value="">Quem recebe</option>
            {allProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:col-span-1"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        {allIncomes.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            Nenhuma renda fixa cadastrada ainda. Cadastre o salário de vocês aqui para ele
            entrar automaticamente no dashboard todo mês.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {allIncomes.map((income) => {
              const receipt = allReceipts.find((r) => r.fixed_income_id === income.id);
              const received = receipt?.received ?? false;
              const category = allCategories.find((c) => c.id === income.category_id);
              const owner = allProfiles.find((p) => p.id === income.profile_id);

              return (
                <li key={income.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">
                      {category?.icon ?? "💼"} {income.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Recebe dia {income.receive_day} · {owner?.name ?? "sem responsável"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-income">
                      +{formatCurrency(income.amount)}
                    </span>

                    <form action={toggleReceipt.bind(null, income.id, received)}>
                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          received
                            ? "bg-income/20 text-income hover:bg-income/30"
                            : "bg-border text-slate-300 hover:bg-border/70"
                        }`}
                      >
                        {received ? "Recebido ✓" : "Marcar como recebido"}
                      </button>
                    </form>

                    <form action={deactivateFixedIncome.bind(null, income.id)}>
                      <button
                        type="submit"
                        className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-expense"
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
