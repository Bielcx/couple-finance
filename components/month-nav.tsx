import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthRef, monthLabel, shiftMonthRef } from "@/lib/utils";

export function MonthNav({ month, basePath }: { month: string; basePath: string }) {
  const prev = shiftMonthRef(month, -1);
  const next = shiftMonthRef(month, 1);
  const isCurrent = month === currentMonthRef();

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`${basePath}?mes=${prev.slice(0, 7)}`}
        aria-label="Mês anterior"
        className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-white active:scale-90"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      <span className="min-w-[130px] text-center text-sm font-medium capitalize">
        {monthLabel(month)}
      </span>

      <Link
        href={`${basePath}?mes=${next.slice(0, 7)}`}
        aria-label="Próximo mês"
        className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-white active:scale-90"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>

      {!isCurrent && (
        <Link
          href={basePath}
          className="ml-1 rounded-full bg-border px-3 py-1.5 text-xs text-white/80 transition hover:bg-surface-hover active:scale-95"
        >
          Hoje
        </Link>
      )}
    </div>
  );
}
