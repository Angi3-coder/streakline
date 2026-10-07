import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStreaks } from '../src/streak.js';

test('empty history', () => assert.deepEqual(computeStreaks([], '2026-10-07'), { current: 0, best: 0 }));
test('counts consecutive days ending today', () =>
  assert.deepEqual(computeStreaks(['2026-10-05', '2026-10-06', '2026-10-07'], '2026-10-07'), { current: 3, best: 3 }));
test('streak survives until the day ends', () =>
  assert.equal(computeStreaks(['2026-10-05', '2026-10-06'], '2026-10-07').current, 2));
test('gap resets current but keeps best', () =>
  assert.deepEqual(computeStreaks(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-06'], '2026-10-07'), { current: 1, best: 3 }));
test('ignores duplicates', () =>
  assert.equal(computeStreaks(['2026-10-07', '2026-10-07'], '2026-10-07').best, 1));
