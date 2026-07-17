import type { Profile, SplitType } from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
 * Retorna os `n` meses anteriores ao mês atual (não inclui o mês atual),
 * em ordem cronológica (do mais antigo para o mais recente).
 */
export function pastMonthRefs(n: number): string[] {
  const now = new Date();
  const months: string[] = [];

  for (let i = n; i >= 1; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`);
  }

  return months;
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
