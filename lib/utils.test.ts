// node --test lib/utils.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  currentMonthRef,
  daysUntilDue,
  pageHref,
  resolvePersonId,
  settledAmount,
  shiftMonthRef,
} from "./utils.ts";
import type { Profile } from "./types.ts";

const now = new Date();
const thisMonth = currentMonthRef();
const today = now.getDate();
const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

test("hoje é dia 0", () => {
  assert.equal(daysUntilDue(today, thisMonth), 0);
});

test("conta os dias que faltam até o vencimento", () => {
  if (today + 1 <= lastDayOfMonth) assert.equal(daysUntilDue(today + 1, thisMonth), 1);
  if (today - 1 >= 1) assert.equal(daysUntilDue(today - 1, thisMonth), -1);
});

test("dia 31 em mês curto cai no último dia, não vaza pro mês seguinte", () => {
  assert.equal(daysUntilDue(31, thisMonth), lastDayOfMonth - today);
});

test("outros meses não têm contagem", () => {
  assert.equal(daysUntilDue(10, shiftMonthRef(thisMonth, 1)), null);
  assert.equal(daysUntilDue(10, shiftMonthRef(thisMonth, -1)), null);
});

const profiles = [
  { id: "aaa", name: "Gabriel", color: "#fff", created_at: "" },
  { id: "bbb", name: "Larissa", color: "#000", created_at: "" },
] as Profile[];

test("só aceita id de perfil que existe; o resto vira visão do casal", () => {
  assert.equal(resolvePersonId("aaa", profiles), "aaa");
  assert.equal(resolvePersonId(undefined, profiles), null);
  assert.equal(resolvePersonId("zzz", profiles), null);
  assert.equal(resolvePersonId(["bbb"], profiles), "bbb");
});

test("acerto abate a dívida de quem transferiu", () => {
  // saldo +100 = Larissa (bbb) deve 100 pro Gabriel (aaa); ela paga, zera
  assert.equal(100 + settledAmount([{ paid_by: "bbb", amount: 100 }], "aaa"), 0);
  // saldo -100 = Gabriel deve 100; ele paga, zera
  assert.equal(-100 + settledAmount([{ paid_by: "aaa", amount: 100 }], "aaa"), 0);
  // pagamento parcial e em parcelas somam
  assert.equal(
    100 +
      settledAmount(
        [
          { paid_by: "bbb", amount: 40 },
          { paid_by: "bbb", amount: 30 },
        ],
        "aaa"
      ),
    30
  );
  assert.equal(settledAmount([], "aaa"), 0);
});

test("href mantém mês e pessoa, e omite o que é padrão", () => {
  assert.equal(pageHref("/dashboard", {}), "/dashboard");
  assert.equal(pageHref("/dashboard", { quem: null }), "/dashboard");
  assert.equal(pageHref("/dashboard", { mes: "2026-07-01" }), "/dashboard?mes=2026-07");
  assert.equal(
    pageHref("/dashboard", { mes: "2026-07-01", quem: "aaa" }),
    "/dashboard?mes=2026-07&quem=aaa"
  );
});
