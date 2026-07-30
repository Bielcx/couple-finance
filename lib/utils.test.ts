// node --test lib/utils.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { currentMonthRef, daysUntilDue, shiftMonthRef } from "./utils.ts";

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
