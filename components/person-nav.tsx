import Link from "next/link";
import { Users } from "lucide-react";
import { pageHref } from "@/lib/utils";
import type { Profile } from "@/lib/types";

/**
 * Alterna a visão entre cada pessoa do casal e os dois juntos.
 * "Ambos" (person = null) é o padrão e não vai na URL.
 */
export function PersonNav({
  profiles,
  person,
  month,
  basePath,
}: {
  profiles: Profile[];
  person: string | null;
  month: string;
  basePath: string;
}) {
  if (profiles.length < 2) return null;

  const options: { id: string | null; label: string; color?: string }[] = [
    ...profiles.map((p) => ({ id: p.id as string | null, label: p.name, color: p.color })),
    { id: null, label: "Ambos" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
      {options.map((option) => {
        const active = option.id === person;
        return (
          <Link
            key={option.id ?? "ambos"}
            href={pageHref(basePath, { mes: month, quem: option.id })}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              active ? "bg-primary text-white shadow-glow" : "text-muted hover:text-white"
            }`}
          >
            {option.id ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: option.color }}
              />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            <span className="max-w-[90px] truncate">{option.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
