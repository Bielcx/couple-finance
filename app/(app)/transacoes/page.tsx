import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonthRef,
  formatCurrency,
  monthLabel,
  monthRangeBounds,
  resolveMonthRef,
  resolvePersonId,
} from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import { MonthNav } from "@/components/month-nav";
import { PersonNav } from "@/components/person-nav";
import { createTransaction, deleteTransaction } from "./actions";
import type { Category, Profile, Transaction } from "@/lib/types";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; quem?: string }>;
}) {
  const { mes, quem } = await searchParams;
  const supabase = await createClient();
  const monthRef = resolveMonthRef(mes);
  const { start: monthStart, end: monthEnd } = monthRangeBounds(monthRef);
  // se estiver vendo o mês atual, novo lançamento parte de hoje; senão, do 1º dia do mês visualizado
  const defaultDate = monthRef === currentMonthRef() ? new Date().toISOString().slice(0, 10) : monthRef;

  const [{ data: transactions }, { data: categories }, { data: profiles }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .gte("occurred_on", monthStart)
      .lt("occurred_on", monthEnd)
      .order("occurred_on", { ascending: false }),
    supabase.from("categories").select("*"),
    supabase.from("profiles").select("*").order("created_at"),
  ]);

  const allCategories = (categories ?? []) as Category[];
  const allProfiles = (profiles ?? []) as Profile[];
  const personId = resolvePersonId(quem, allProfiles);

  // ponytail: filtra em memória — são poucos lançamentos por mês
  const allTransactions = ((transactions ?? []) as Transaction[]).filter(
    (t) => !personId || t.paid_by === personId
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transações</h1>
          <p className="text-sm text-muted capitalize">{monthLabel(monthRef)}</p>
        </div>
        <MonthNav month={monthRef} basePath="/transacoes" person={personId} />
      </div>

      <PersonNav
        profiles={allProfiles}
        person={personId}
        month={monthRef}
        basePath="/transacoes"
      />

      <div className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Novo lançamento</h2>
        <form action={createTransaction} className="flex flex-col gap-3">
          {/* O caso comum é um gasto de hoje, dividido meio a meio: só descrição,
              valor e quem pagou. O resto fica no "Mais opções" abaixo. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              name="description"
              required
              placeholder="Descrição"
              className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow sm:flex-[2]"
            />
            <input
              name="amount"
              inputMode="decimal"
              required
              placeholder="R$ 0,00"
              className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow sm:flex-1"
            />
            <select
              name="paid_by"
              required
              defaultValue={personId ?? allProfiles[0]?.id ?? ""}
              className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow sm:flex-1"
            >
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  Pago por {p.name}
                </option>
              ))}
            </select>
          </div>

          <details className="group rounded-3xl border border-border bg-background/50 px-4 py-3">
            <summary className="cursor-pointer list-none text-xs text-muted marker:content-none">
              Gasto · hoje · dividido 50/50
              <span className="ml-2 text-primary group-open:hidden">ajustar</span>
            </summary>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select name="type" defaultValue="expense" className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow">
                <option value="expense">Gasto</option>
                <option value="income">Receita</option>
              </select>
              <input
                name="occurred_on"
                type="date"
                defaultValue={defaultDate}
                className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
              />
              <select name="category_id" className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow">
                <option value="">Sem categoria</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select name="split_type" defaultValue="50_50" className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow">
                <option value="50_50">Dividir 50/50</option>
                <option value="integral">Só quem pagou (não divide)</option>
                <option value="custom">Percentual customizado</option>
              </select>
              <input
                name="split_percent_a"
                type="number"
                min={0}
                max={100}
                placeholder={`% de ${allProfiles[0]?.name ?? "pessoa 1"} (se customizado)`}
                className="w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow sm:col-span-2"
              />
            </div>
          </details>

          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-glow transition hover:bg-primary-hover active:scale-[0.97] sm:self-start sm:px-8"
          >
            Adicionar
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-border bg-surface">
        {allTransactions.length === 0 ? (
          <p className="p-5 text-sm text-muted/70">
            {personId
              ? `Nenhuma transação de ${
                  allProfiles.find((p) => p.id === personId)?.name
                } neste mês ainda.`
              : "Nenhuma transação lançada neste mês ainda."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {allTransactions.map((t, i) => {
              const category = allCategories.find((c) => c.id === t.category_id);
              const person = allProfiles.find((p) => p.id === t.paid_by);

              return (
                <li
                  key={t.id}
                  className="fade-in-up flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium">
                      <CategoryIcon icon={category?.icon} className="h-4 w-4 text-muted" />
                      {t.description}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      {category && (
                        <span
                          className="rounded-full px-2 py-0.5 font-medium"
                          style={{ color: category.color, backgroundColor: `${category.color}1a` }}
                        >
                          {category.name}
                        </span>
                      )}
                      <span>
                        {new Date(t.occurred_on).toLocaleDateString("pt-BR")} · {person?.name ?? "?"}
                      </span>
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
                        className="rounded-full p-1.5 text-muted/70 transition hover:text-expense active:scale-90"
                        title="Excluir"
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
