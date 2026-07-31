import type { Profile, SplitType } from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// ponytail: classes repetidas em todos os forms — const em vez de componente wrapper
export const inputClass =
  "rounded-3xl border border-border bg-background px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary focus:shadow-glow";

export const buttonClass =
  "rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-glow transition hover:bg-primary-hover active:scale-[0.97]";

/**
 * Dias até o dia `day` do mês `monthRef`. Negativo = já passou.
 * Só faz sentido para o mês corrente; nos outros retorna null.
 */
export function daysUntilDue(day: number, monthRef: string): number | null {
  if (monthRef !== currentMonthRef()) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month] = monthRef.split("-").map(Number);
  // dia 31 em mês de 30 dias vira o último dia do mês
  const lastDay = new Date(year, month, 0).getDate();
  const due = new Date(year, month - 1, Math.min(day, lastDay));

  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function currentMonthRef(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(monthRef: string): string {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function shortMonthLabel(monthRef: string): string {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export function monthRangeBounds(monthRef: string): { start: string; end: string } {
  const [year, month] = monthRef.split("-").map(Number);
  const end = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-01`;
  return { start: monthRef, end };
}

/**
 * Retorna os `n` meses anteriores a `referenceMonthRef` (não o inclui),
 * em ordem cronológica (do mais antigo para o mais recente).
 * Se `referenceMonthRef` não for informado, usa o mês atual.
 */
export function pastMonthRefs(n: number, referenceMonthRef?: string): string[] {
  const [refYear, refMonth] = referenceMonthRef
    ? referenceMonthRef.split("-").map(Number)
    : (() => {
        const now = new Date();
        return [now.getFullYear(), now.getMonth() + 1];
      })();

  const months: string[] = [];

  for (let i = n; i >= 1; i--) {
    const date = new Date(refYear, refMonth - 1 - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`);
  }

  return months;
}

/**
 * Desloca um month_ref em `delta` meses (positivo = futuro, negativo = passado).
 */
export function shiftMonthRef(monthRef: string, delta: number): string {
  const [year, month] = monthRef.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Lê o parâmetro de mês da URL (?mes=YYYY-MM ou YYYY-MM-01) e normaliza.
 * Se ausente ou inválido, retorna o mês atual.
 */
export function resolveMonthRef(param: string | string[] | undefined): string {
  const value = Array.isArray(param) ? param[0] : param;

  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return `${value}-01`;
  }

  if (value && /^\d{4}-\d{2}-01$/.test(value)) {
    return value;
  }

  return currentMonthRef();
}

/**
 * Lê o parâmetro de pessoa da URL (?quem=<profile.id>).
 * Se ausente ou desconhecido, retorna null = visão do casal (os dois juntos).
 */
export function resolvePersonId(
  param: string | string[] | undefined,
  profiles: Profile[]
): string | null {
  const value = Array.isArray(param) ? param[0] : param;
  return value && profiles.some((p) => p.id === value) ? value : null;
}

/**
 * Monta o href de uma página preservando mês e pessoa selecionados.
 */
export function pageHref(
  basePath: string,
  params: { mes?: string; quem?: string | null }
): string {
  const query = new URLSearchParams();
  if (params.mes) query.set("mes", params.mes.slice(0, 7));
  if (params.quem) query.set("quem", params.quem);
  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/**
 * Calcula quanto cada pessoa deve pagar de um gasto, dado o tipo de divisão.
 * `profileAId` é considerado o "profile A" para split_type = 'custom'.
 */
export function calculateSplit(
  amount: number,
  splitType: SplitType,
  splitPercentA: number | null,
  paidById: string,
  profileAId: string,
  profileBId: string
): { [profileId: string]: number } {
  if (splitType === "integral") {
    // quem pagou absorve o valor todo (não há divisão)
    return { [paidById]: amount };
  }

  if (splitType === "50_50") {
    return {
      [profileAId]: amount / 2,
      [profileBId]: amount / 2,
    };
  }

  // custom
  const pctA = splitPercentA ?? 50;
  return {
    [profileAId]: (amount * pctA) / 100,
    [profileBId]: (amount * (100 - pctA)) / 100,
  };
}

/**
 * Dado um conjunto de lançamentos (com quem pagou e como foi dividido),
 * calcula o saldo líquido entre as duas pessoas.
 * Retorna valor positivo = profileB deve para profileA, negativo = contrário.
 */
/**
 * Quanto os acertos já pagos deslocam o saldo do casal.
 * Mesma convenção do calculateBalance: positivo => B deve para A. Quem
 * transfere abate a própria dívida, então A pagando empurra o saldo pra cima.
 */
export function settledAmount(
  settlements: Array<{ paid_by: string; amount: number }>,
  profileAId: string
): number {
  return settlements.reduce(
    (sum, s) => sum + (s.paid_by === profileAId ? s.amount : -s.amount),
    0
  );
}

export function calculateBalance(
  entries: Array<{
    amount: number;
    paid_by: string;
    split_type: SplitType;
    split_percent_a: number | null;
  }>,
  profileA: Profile,
  profileB: Profile
): number {
  let balance = 0; // positivo => B deve para A

  for (const entry of entries) {
    const owed = calculateSplit(
      entry.amount,
      entry.split_type,
      entry.split_percent_a,
      entry.paid_by,
      profileA.id,
      profileB.id
    );

    const aOwes = owed[profileA.id] ?? 0;
    const bOwes = owed[profileB.id] ?? 0;

    if (entry.paid_by === profileA.id) {
      // A pagou, B deve a parte dele para A
      balance += bOwes;
    } else if (entry.paid_by === profileB.id) {
      // B pagou, A deve a parte dele para B
      balance -= aOwes;
    }
  }

  return balance;
}
