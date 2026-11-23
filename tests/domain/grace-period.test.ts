import { describe, it, expect } from 'vitest';
import { DEFAULT_GRACE_PERIOD_MS, graceWindow } from '../../src/domain/utils/grace-period';

const NOW = Date.parse('2026-11-23T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

describe('graceWindow', () => {
  it('healthy subscriptions keep full write access', () => {
    for (const status of ['active', 'trialing']) {
      expect(graceWindow({ subscriptionStatus: status, now: NOW })).toEqual({
        active: false, readsAllowed: true, writesAllowed: true,
      });
    }
  });

  it('past-due inside the window: reads open, writes closed, end stamped', () => {
    const w = graceWindow({ subscriptionStatus: 'past_due', pastDueSince: NOW - 2 * DAY, now: NOW });
    expect(w.active).toBe(true);
    expect(w.readsAllowed).toBe(true);
    expect(w.writesAllowed).toBe(false);
    expect(w.endsAt).toBe(new Date(NOW - 2 * DAY + DEFAULT_GRACE_PERIOD_MS).toISOString());
  });

  it('past-due beyond the window: recoverable flag flips, access unchanged', () => {
    const w = graceWindow({ subscriptionStatus: 'past_due', pastDueSince: NOW - 8 * DAY, now: NOW });
    expect(w.active).toBe(false);
    expect(w.readsAllowed).toBe(true);
    expect(w.writesAllowed).toBe(false);
  });

  it('honors a custom grace length and ISO/number timestamps', () => {
    const w = graceWindow({
      subscriptionStatus: 'past_due',
      pastDueSince: new Date(NOW - 3 * DAY).toISOString(),
      now: new Date(NOW).toISOString(),
      graceMs: 2 * DAY,
    });
    expect(w.active).toBe(false);
  });

  it('never blinds the customer — reads stay true for every status', () => {
    for (const status of ['canceled', 'revoked', 'unpaid', 'incomplete_expired', 'none', 'garbage', 42, undefined]) {
      expect(graceWindow({ subscriptionStatus: status, now: NOW }).readsAllowed).toBe(true);
    }
  });

  it('unknown statuses lose writes (fail closed on mutation)', () => {
    expect(graceWindow({ subscriptionStatus: 'garbage', now: NOW }).writesAllowed).toBe(false);
    expect(graceWindow({ subscriptionStatus: 'canceled', now: NOW }).writesAllowed).toBe(false);
  });
});
