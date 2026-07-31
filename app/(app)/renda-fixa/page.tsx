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
  createFixedIncome,
  deactivateFixedIncome,
  toggleReceipt,
  updateFixedIncome,
} from "./actions";
import type { Category, FixedIncome, FixedIncomeReceipt, Profile } from "@/lib/types";

export default async function RendaFixaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; quem?: string }>;
}) {
  const { mes, quem } = await searchParams;
  const supabase = await createClient();
  const monthRef = resolveMonthRef(mes);

  const [{ data: fixedIncomes }, { data: receipts }, { data: categories }, { data: profiles }] =
    await Promise.all([
      supabase.from("fixed_incomes").select("*").eq("active", true).order("receive_day"),
      supabase.from("fixed_income_receipts").select("*").eq("month_ref", monthRef),
      supabase.from("categories").select("*").in("kind", ["income"]),
      supabase.from("profiles").select("*").order("created_at"),
    ]);

  const allReceipts = (receipts ?? []) as FixedIncomeReceipt[];
  const allCategories = (categories ?? []) as Category[];
  const allProfiles = (profiles ?? []) as Profile[];
  const personId = resolvePersonId(quem, allProfiles);

  // ponytail: filtra em memória — são poucas rendas fixas
  const allIncomes = ((fixedIncomes ?? []) as FixedIncome[]).filter(
    (income) => !personId || income.profile_id === personId
  );

  const rows = allIncomes.map((income) => {
    const receipt = allReceipts.find((r) => r.fixed_income_id === income.id);
    return {
      income,
      amount: receipt?.amount_override ?? income.amount,
      received: receipt?.received ?? false,
      days: daysUntilDue(income.receive_day, monthRef),
      category: allCategories.find((c) => c.id === income.category_id),
      owner: allProfiles.find((p) => p.id === income.profile_id),
    };
  });

  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  const receivedRows = rows.filter((r) => r.received);
  const receivedTotal = receivedRows.reduce((sum, r) => sum + r.amount, 0);

  const pending = rows.filter((r) => !r.received);
  const groups = [
    {
      title: "Chega essa semana",
      rows: pending.filter((r) => r.days !== null && r.days <= 7),
      highlight: true,
    },
    {
      title: "A receber",
      rows: pending.filter((r) => r.days === null || r.days > 7),
      highlight: false,
    },
    { title: "Recebidos", rows: receivedRows, highlight: false },
  ].filter((g) => g.rows.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Renda Fixa</h1>
          <p className="text-sm text-muted capitalize">
            {monthLabel(monthRef)} — salário e outras receitas recorrentes
          </p>
        </div>
        <MonthNav month={monthRef} basePath="/renda-fixa" person={personId} />
      </div>

      <PersonNav
        profiles={allProfiles}
        person={personId}
        month={monthRef}
        basePath="/renda-fixa"
      />

      <SummaryBar
        total={total}
        done={receivedTotal}
        doneCount={receivedRows.length}
        totalCount={rows.length}
        doneLabel="Já recebido"
        pendingLabel="Falta receber"
        tone="income"
      />

      <details className="group rounded-3xl border border-border bg-surface">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-medium text-muted transition hover:text-white">
          <Plus className="h-4 w-4 transition group-open:rotate-45" />
          Nova renda fixa
        </summary>
        <form
          action={createFixedIncome}
          className="grid grid-cols-1 gap-3 border-t border-border p-5 sm:grid-cols-2 md:grid-cols-3"
        >
          <IncomeFields categories={allCategories} profiles={allProfiles} />
          <button type="submit" className={buttonClass}>
            Adicionar
          </button>
        </form>
      </details>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-border bg-surface p-5 text-sm text-muted/70">
          {personId
            ? `Nenhuma renda fixa de ${allProfiles.find((p) => p.id === personId)?.name} cadastrada.`
            : "Nenhuma renda fixa cadastrada ainda. Cadastre o salário de vocês aqui para ele entrar automaticamente no dashboard todo mês."}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.title} className="flex flex-col gap-2">
            <h2
              className={`px-1 text-xs font-medium uppercase tracking-wide ${
                group.highlight ? "text-income" : "text-muted"
              }`}
            >
              {group.title} · {group.rows.length}
            </h2>

            <ul className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-surface">
              {group.rows.map((row, i) => (
                <li
                  key={row.income.id}
                  className="fade-in-up p-4"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 font-medium">
                        <CategoryIcon icon={row.category?.icon} className="h-4 w-4 text-muted" />
                        {row.income.name}
                      </p>
                      <p className="text-xs text-muted">
                        {receiveLabel(row.income.receive_day, row.days, row.received)} ·{" "}
                        {row.owner?.name ?? "sem responsável"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-income">
                        +{formatCurrency(row.amount)}
                      </span>

                      <form
                        action={toggleReceipt.bind(null, row.income.id, row.received, monthRef)}
                      >
                        <button
                          type="submit"
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                            row.received
                              ? "bg-income/20 text-income hover:bg-income/30"
                              : "bg-border text-white/80 hover:bg-surface-hover"
                          }`}
                        >
                          {row.received && <Check className="h-3.5 w-3.5" />}
                          {row.received ? "Recebido" : "Marcar como recebido"}
                        </button>
                      </form>

                      <form action={deactivateFixedIncome.bind(null, row.income.id)}>
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
                      action={updateFixedIncome.bind(null, row.income.id)}
                      className="mt-3 grid grid-cols-1 gap-3 rounded-2xl bg-background/50 p-4 sm:grid-cols-2 md:grid-cols-3"
                    >
                      <IncomeFields
                        categories={allCategories}
                        profiles={allProfiles}
                        income={row.income}
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
function IncomeFields({
  categories,
  profiles,
  income,
}: {
  categories: Category[];
  profiles: Profile[];
  income?: FixedIncome;
}) {
  return (
    <>
      <input
        name="name"
        required
        defaultValue={income?.name}
        placeholder="Nome (ex: Salário)"
        className={inputClass}
      />
      <input
        name="amount"
        type="number"
        step="0.01"
        required
        defaultValue={income?.amount}
        placeholder="Valor"
        className={inputClass}
      />
      <input
        name="receive_day"
        type="number"
        min={1}
        max={31}
        required
        defaultValue={income?.receive_day}
        placeholder="Dia do recebimento"
        className={inputClass}
      />
      <select name="category_id" defaultValue={income?.category_id ?? ""} className={inputClass}>
        <option value="">Categoria</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        name="profile_id"
        required
        defaultValue={income?.profile_id ?? ""}
        className={inputClass}
      >
        <option value="">Quem recebe</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </>
  );
}

function receiveLabel(day: number, days: number | null, received: boolean): string {
  if (received || days === null) return `Recebe dia ${day}`;
  if (days < 0) return `Era dia ${day} — ainda não caiu`;
  if (days === 0) return "Cai hoje";
  if (days === 1) return "Cai amanhã";
  return `Cai em ${days} dias`;
}
