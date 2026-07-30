import { formatCurrency } from "@/lib/utils";

/**
 * Resumo do mês para gastos fixos / renda fixa:
 * total, quanto já foi resolvido (pago/recebido) e quanto falta.
 */
export function SummaryBar({
  total,
  done,
  doneCount,
  totalCount,
  doneLabel,
  pendingLabel,
  tone,
}: {
  total: number;
  done: number;
  doneCount: number;
  totalCount: number;
  doneLabel: string;
  pendingLabel: string;
  tone: "income" | "expense";
}) {
  const pending = total - done;
  const percent = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted">Total do mês</p>
          <p className={`text-2xl font-semibold ${tone === "income" ? "text-income" : "text-expense"}`}>
            {formatCurrency(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{doneLabel}</p>
          <p className="text-lg font-medium text-income">{formatCurrency(done)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">{pendingLabel}</p>
          <p className="text-lg font-medium">{formatCurrency(pending)}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-income transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted/70">
        {doneCount} de {totalCount} · {Math.round(percent)}%
      </p>
    </div>
  );
}
