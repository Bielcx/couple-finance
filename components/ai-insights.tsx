"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { getInsights } from "@/app/(app)/dashboard/actions";

export function AiInsights({ summary }: { summary: string }) {
  const [lines, setLines] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function analyze() {
    setError(null);
    startTransition(async () => {
      try {
        const text = await getInsights(summary);
        setLines(
          text
            .split("\n")
            .map((l) => l.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean)
        );
      } catch {
        setError("Não deu para falar com a IA agora. Tente de novo.");
      }
    });
  }

  return (
    <div
      className="fade-in-up rounded-3xl border border-border bg-surface p-5"
      style={{ animationDelay: "180ms" }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted">
          <Sparkles className="h-4 w-4 text-primary" />
          Recomendações da IA
        </h2>

        <button
          onClick={analyze}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white shadow-glow transition hover:bg-primary-hover active:scale-95 disabled:opacity-60"
        >
          {pending ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {pending ? "Analisando..." : lines ? "Analisar de novo" : "Analisar meu mês"}
        </button>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      {!lines && !pending && !error && (
        <p className="text-sm text-muted/70">
          A IA olha as receitas, os gastos fixos, os variáveis e o saldo entre vocês, e sugere onde
          dá para melhorar neste mês.
        </p>
      )}

      {lines && (
        <ul className="flex flex-col gap-3">
          {lines.map((line, i) => (
            <li
              key={i}
              className="fade-in-up flex gap-3 rounded-2xl bg-background/50 p-3 text-sm leading-relaxed"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{renderBold(line)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** ponytail: só **negrito** — não vale puxar um parser de markdown pra isso */
function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-white">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}
