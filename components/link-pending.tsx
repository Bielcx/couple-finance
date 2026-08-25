"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

/**
 * Spinner que aparece enquanto a navegação do Link pai está pendente.
 * Trocar mês/pessoa altera só os searchParams, e nesse caso o Next mantém a
 * tela antiga sem mostrar o loading.tsx — sem isso o clique parece travado.
 */
export function LinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Loader2 className="h-3 w-3 shrink-0 animate-spin" />;
}
