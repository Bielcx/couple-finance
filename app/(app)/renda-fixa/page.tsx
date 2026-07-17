import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { currentMonthRef, formatCurrency } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
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
        <p className="text-sm text-muted">
          Salário e outras receitas recorrentes de vocês dois
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Nova renda fixa</h2>
        <form action={createFixedIncome} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <input
            name="name"
            required
            placeholder="Nome (ex: Salário)"
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
            name="receive_day"
            type="number"
            min={1}
            max={31}
            required
            placeholder="Dia do recebimento"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <select
            name="category_id"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          >
            <option value="">Categoria</option>
            {allCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="profile_id"
            required
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow sm:col-span-1"
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
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:bg-primary-hover active:scale-[0.97] sm:col-span-1"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-border bg-surface">
        {allIncomes.length === 0 ? (
          <p className="p-5 text-sm text-muted/70">
            Nenhuma renda fixa cadastrada ainda. Cadastre o salário de vocês aqui para ele
            entrar automaticamente no dashboard todo mês.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {allIncomes.map((income, i) => {
              const receipt = allReceipts.find((r) => r.fixed_income_id === income.id);
              const received = receipt?.received ?? false;
              const category = allCategories.find((c) => c.id === income.category_id);
              const owner = allProfiles.find((p) => p.id === income.profile_id);

              return (
                <li
                  key={income.id}
                  className="fade-in-up flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <CategoryIcon icon={category?.icon} className="h-4 w-4 text-muted" />
                      {income.name}
                    </p>
                    <p className="text-xs text-muted">
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
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                          received
                            ? "bg-income/20 text-income hover:bg-income/30"
                            : "bg-border text-white/80 hover:bg-surface-hover"
                        }`}
                      >
                        {received && <Check className="h-3.5 w-3.5" />}
                        {received ? "Recebido" : "Marcar como recebido"}
                      </button>
                    </form>

                    <form action={deactivateFixedIncome.bind(null, income.id)}>
                      <button
                        type="submit"
                        className="rounded-full p-1.5 text-muted/70 transition hover:text-expense active:scale-90"
                        title="Desativar"
                      >
                        <X className="h-3.5 w-3.5" />
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
