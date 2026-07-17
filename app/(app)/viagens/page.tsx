import Link from "next/link";
import { Plane } from "lucide-react";
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
        <p className="text-sm text-muted">
          Anote os gastos de cada viagem separadamente e acertem as contas no final
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-medium text-muted">Nova viagem</h2>
        <form action={createTrip} className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <input
            name="name"
            required
            placeholder="Nome (ex: Praia)"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <input
            name="destination"
            placeholder="Destino (opcional)"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <input
            name="start_date"
            type="date"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <input
            name="end_date"
            type="date"
            className="rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow"
          />
          <button
            type="submit"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:bg-primary-hover active:scale-[0.97] sm:col-span-2 md:col-span-4"
          >
            Criar viagem
          </button>
        </form>
      </div>

      {allTrips.length === 0 ? (
        <p className="text-sm text-muted/70">Nenhuma viagem cadastrada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {allTrips.map((trip, i) => {
            const total = allExpenses
              .filter((e) => e.trip_id === trip.id)
              .reduce((sum, e) => sum + e.amount, 0);

            return (
              <Link
                key={trip.id}
                href={`/viagens/${trip.id}`}
                className="fade-in-up rounded-3xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-glow"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Plane className="h-4 w-4 text-primary" />
                    {trip.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      trip.status === "open"
                        ? "bg-income/20 text-income"
                        : "bg-border text-muted"
                    }`}
                  >
                    {trip.status === "open" ? "Em aberto" : "Fechada"}
                  </span>
                </div>
                {trip.destination && (
                  <p className="text-xs text-muted">{trip.destination}</p>
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
