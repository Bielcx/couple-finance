// node app/(app)/transacoes/amount.test.mjs
import assert from "node:assert/strict";

// cópia da lógica de parseAmount (lib/utils.ts é TS; este check roda sem build)
function parseAmount(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return NaN;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
  return Number(normalized);
}

assert.equal(parseAmount("10,50"), 10.5, "vírgula é o separador decimal do teclado BR");
assert.equal(parseAmount("10.50"), 10.5, "ponto continua valendo");
assert.equal(parseAmount("1.234,56"), 1234.56, "separador de milhar com vírgula decimal");
assert.equal(parseAmount("42"), 42);
assert.ok(Number.isNaN(parseAmount("")), "vazio não vira 0");
assert.ok(Number.isNaN(parseAmount("abc")));
console.log("ok");
