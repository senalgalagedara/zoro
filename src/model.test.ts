import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAmount, addGift, initial, type Data } from "./model.ts";
test("amounts reject invalid precision, non-finite, negative and excess amounts", () => {
  for (const s of ["", "0", "-5", "1.001", "Infinity", "abc", "1e3"])
    assert.equal(validateAmount(s), null);
  assert.equal(validateAmount("100.25"), 100.25);
  assert.equal(validateAmount("101", 100), null);
  assert.equal(validateAmount("1.23", 100, 2), 1.23);
  assert.equal(validateAmount("1.234", 100, 3), 1.234);
  assert.equal(validateAmount("1.01", 100, 0), null);
  assert.equal(validateAmount("10", Number.POSITIVE_INFINITY), null);
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
  assert.throws(() => addGift(initial, { ...g, amount: Number.NaN }));
  assert.throws(() => addGift(initial, { ...g, amount: 1.001 }));
  assert.throws(() => addGift(initial, { ...g, currency: "USD" }));
});
test("gift amounts respect zero- and three-decimal currencies", () => {
  const requestData: Data = {
    gifts: [],
    requests: [
      {
        ...initial.requests[0],
        id: "kwd",
        owner: "someone-else",
        goal: 2,
        raised: 1.5,
        currency: "KWD",
      },
      {
        ...initial.requests[1],
        id: "jpy",
        owner: "someone-else",
        goal: 1000,
        raised: 500,
        currency: "JPY",
      },
    ],
  };
  const baseGift = {
    id: "g1",
    title: "Example",
    anonymous: false,
    message: "",
    date: "2026-11-04",
  };
  const kwdGift = {
    ...baseGift,
    requestId: "kwd",
    amount: 0.001,
    currency: "KWD",
  };
  assert.equal(addGift(requestData, kwdGift).requests[0].raised, 1.501);
  assert.throws(() => addGift(requestData, { ...kwdGift, amount: 0.0001 }));
  const jpyGift = {
    ...baseGift,
    requestId: "jpy",
    amount: 1,
    currency: "JPY",
  };
  assert.equal(addGift(requestData, jpyGift).requests[1].raised, 501);
  assert.throws(() => addGift(requestData, { ...jpyGift, amount: 0.5 }));
});
