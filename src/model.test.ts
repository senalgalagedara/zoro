import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAmount, addGift, initial } from "./model.ts";
test("amounts reject invalid precision, non-finite, negative and excess amounts", () => {
  for (const s of ["", "0", "-5", "1.001", "Infinity", "abc", "1e3"])
    assert.equal(validateAmount(s), null);
  assert.equal(validateAmount("100.25"), 100.25);
  assert.equal(validateAmount("101", 100), null);
});
test("gift updates only its request and records history without mutating old state", () => {
  const g = {
    id: "g1",
    requestId: "1",
    title: "Example",
    amount: 500,
    anonymous: true,
    message: "Good luck",
    date: "2026-11-04",
  };
  const result = addGift(initial, g);
  assert.equal(result.requests[0].raised, 17000);
  assert.equal(initial.requests[0].raised, 16500);
  assert.equal(result.requests[1], initial.requests[1]);
  assert.equal(result.gifts[0], g);
  assert.throws(() => addGift(initial, { ...g, amount: 8501 }));
  assert.throws(() => addGift(initial, { ...g, requestId: "4" }));
});
