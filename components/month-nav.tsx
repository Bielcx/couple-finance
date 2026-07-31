import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonthRef, monthLabel, pageHref, shiftMonthRef } from "@/lib/utils";

export function MonthNav({
  month,
  basePath,
  person = null,
}: {
  month: string;
  basePath: string;
  person?: string | null;
}) {
  const prev = shiftMonthRef(month, -1);
  const next = shiftMonthRef(month, 1);
  const isCurrent = month === currentMonthRef();

  return (
    <div className="flex items-center gap-1">
      <Link
        href={pageHref(basePath, { mes: prev, quem: person })}
        aria-label="Mês anterior"
        className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-white active:scale-90"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      <span className="min-w-[130px] text-center text-sm font-medium capitalize">
        {monthLabel(month)}
      </span>

      <Link
        href={pageHref(basePath, { mes: next, quem: person })}
        aria-label="Próximo mês"
        className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-white active:scale-90"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>

      {!isCurrent && (
        <Link
          href={pageHref(basePath, { quem: person })}
          className="ml-1 rounded-full bg-border px-3 py-1.5 text-xs text-white/80 transition hover:bg-surface-hover active:scale-95"
        >
          Hoje
        </Link>
      )}
    </div>
  );
}
