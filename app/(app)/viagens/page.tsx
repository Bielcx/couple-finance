import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { createTrip } from "./actions";
import type { Trip, TripExpense } from "@/lib/types";

export default async function ViagensPage() {
  const supabase = await createClient();

  const [{ data: trips }, { data: expenses }] = await Promise.all([
    supabase.from("trips").select("*").order("created_at", { ascending: false }),
    supabase.from("trip_expenses").select("*"),
  ]);

  const allTrips = (trips ?? []) as Trip[];
  const allExpenses = (expenses ?? []) as TripExpense[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Viagens</h1>
        <p className="text-sm text-slate-400">
          Anote os gastos de cada viagem separadamente e acertem as contas no final
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-slate-400">Nova viagem</h2>
        <form action={createTrip} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Nome (ex: Praia)"
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            name="destination"
            placeholder="Destino (opcional)"
            className="col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary sm:col-span-1"
          />
          <input
            name="start_date"
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input
            name="end_date"
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:col-span-4"
          >
            Criar viagem
          </button>
        </form>
      </div>

      {allTrips.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma viagem cadastrada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {allTrips.map((trip) => {
            const total = allExpenses
              .filter((e) => e.trip_id === trip.id)
              .reduce((sum, e) => sum + e.amount, 0);

            return (
              <Link
                key={trip.id}
                href={`/viagens/${trip.id}`}
                className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">🧳 {trip.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      trip.status === "open"
                        ? "bg-income/20 text-income"
                        : "bg-border text-slate-400"
                    }`}
                  >
                    {trip.status === "open" ? "Em aberto" : "Fechada"}
                  </span>
                </div>
                {trip.destination && (
                  <p className="text-xs text-slate-400">{trip.destination}</p>
                )}
                <p className="mt-3 text-lg font-semibold">{formatCurrency(total)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
