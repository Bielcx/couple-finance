import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateBalance, formatCurrency } from "@/lib/utils";
import { toggleTripStatus, deleteTrip } from "../actions";
import { addTripExpense, deleteTripExpense } from "./actions";
import type { Profile, Trip, TripExpense } from "@/lib/types";

export default async function ViagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: trip }, { data: expenses }, { data: profiles }] = await Promise.all([
    supabase.from("trips").select("*").eq("id", id).single(),
    supabase.from("trip_expenses").select("*").eq("trip_id", id).order("occurred_on", { ascending: false }),
    supabase.from("profiles").select("*").order("created_at"),
  ]);

  if (!trip) {
    notFound();
  }

  const currentTrip = trip as Trip;
  const allExpenses = (expenses ?? []) as TripExpense[];
  const allProfiles = (profiles ?? []) as Profile[];

  const total = allExpenses.reduce((sum, e) => sum + e.amount, 0);

  let balance = 0;
  if (allProfiles.length === 2) {
    balance = calculateBalance(allExpenses, allProfiles[0], allProfiles[1]);
  }

  const addExpenseWithTrip = addTripExpense.bind(null, id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/viagens" className="text-xs text-slate-500 hover:text-slate-300">
          ← Viagens
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">🧳 {currentTrip.name}</h1>
            {currentTrip.destination && (
              <p className="text-sm text-slate-400">{currentTrip.destination}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <form action={toggleTripStatus.bind(null, id, currentTrip.status === "open")}>
              <button
                type="submit"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  currentTrip.status === "open"
                    ? "bg-income/20 text-income hover:bg-income/30"
                    : "bg-border text-slate-300 hover:bg-border/70"
                }`}
              >
                {currentTrip.status === "open" ? "Em aberto" : "Fechada"}
              </button>
            </form>

            <form action={deleteTrip.bind(null, id)}>
              <button
                type="submit"
                className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-expense"
                title="Excluir viagem"
              >
                ✕
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-slate-400">Total gasto na viagem</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(total)}</p>
        </div>

        {allProfiles.length === 2 && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs text-slate-400">Acerto de contas</p>
            {balance === 0 ? (
              <p className="mt-1 text-lg font-semibold">Tudo quitado 🎉</p>
            ) : balance > 0 ? (
              <p className="mt-1 text-lg font-semibold">
                {allProfiles[1].name} deve {formatCurrency(balance)} para {allProfiles[0].name}
              </p>
            ) : (
              <p className="mt-1 text-lg font-semibold">
                {allProfiles[0].name} deve {formatCurrency(-balance)} para {allProfiles[1].name}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-400">Novo gasto da viagem</h2>
        <form action={addExpenseWithTrip} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <input
            name="description"
            required
            placeholder="Descrição (ex: Jantar)"
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
            name="paid_by"
            required
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Quem pagou</option>
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
        {allExpenses.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Nenhum gasto lançado nessa viagem ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {allExpenses.map((expense) => {
              const person = allProfiles.find((p) => p.id === expense.paid_by);

              return (
                <li key={expense.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(expense.occurred_on).toLocaleDateString("pt-BR")} ·{" "}
                      {person?.name ?? "?"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-expense">
                      {formatCurrency(expense.amount)}
                    </span>

                    <form action={deleteTripExpense.bind(null, id, expense.id)}>
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
