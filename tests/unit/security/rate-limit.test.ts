import { describe, expect, it } from 'vitest';
import { consume, reset, retryAfterMinutes } from '@/lib/security/rate-limit';
import { withTestDatabase } from '@/tests/setup/db';

withTestDatabase();

describe('consume', () => {
  it('allows up to the limit and refuses after it', async () => {
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await consume('login:a', 3, 60_000));

    expect(results.map((result) => result.allowed)).toEqual([true, true, true, false]);
    expect(results[2].remaining).toBe(0);
  });

  it('counts each key separately', async () => {
    await consume('login:a', 1, 60_000);

    expect((await consume('login:b', 1, 60_000)).allowed).toBe(true);
  });

  it('opens a fresh window once the old one has expired', async () => {
    const start = new Date('2026-08-27T10:00:00.000Z');
    const later = new Date('2026-08-27T10:02:00.000Z');

    expect((await consume('login:c', 1, 60_000, start)).allowed).toBe(true);
    expect((await consume('login:c', 1, 60_000, start)).allowed).toBe(false);
    expect((await consume('login:c', 1, 60_000, later)).allowed).toBe(true);
  });

  it('charges every attempt when several arrive at once', async () => {
    const results = await Promise.all([
      consume('login:d', 2, 60_000),
      consume('login:d', 2, 60_000),
      consume('login:d', 2, 60_000),
    ]);

    expect(results.filter((result) => result.allowed)).toHaveLength(2);
  });

  it('hands the budget back on reset', async () => {
    await consume('login:e', 1, 60_000);
    await reset('login:e');

    expect((await consume('login:e', 1, 60_000)).allowed).toBe(true);
  });

  it('reports a wait of at least a minute', () => {
    expect(retryAfterMinutes({ allowed: false, remaining: 0, retryAfterMs: 1 })).toBe(1);
    expect(retryAfterMinutes({ allowed: false, remaining: 0, retryAfterMs: 400_000 })).toBe(7);
  });
});
