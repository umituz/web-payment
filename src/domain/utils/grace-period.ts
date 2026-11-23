import { SUBSCRIPTION_STATUS, isKnownSubscriptionStatus } from '../enums/subscription-status.enum';

/** Grace-period policy (v1.6.0). When a renewal charge fails the
 *  subscription enters 'past_due': reads stay open forever (billing
 *  never blinds a customer to their own data), writes close for a fixed
 *  window so the workspace freezes rather than silently freeloading.
 *  After the window the subscription is the provider's to revoke — the
 *  util just reports that the recoverable window has closed. */

export const DEFAULT_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000;

export interface GraceWindow {
  /** True while the past-due subscription is still inside its
   *  recoverable window. */
  active: boolean;
  /** Data visibility — always true. */
  readsAllowed: boolean;
  /** Mutation rights — only for healthy subscriptions. */
  writesAllowed: boolean;
  /** When the grace window closes (past-due only). */
  endsAt?: string;
}

export interface GraceWindowInput {
  subscriptionStatus: unknown;
  pastDueSince?: unknown;
  now?: number | string;
  graceMs?: number;
}

function toMillis(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function graceWindow(input: GraceWindowInput): GraceWindow {
  const now = toMillis(input.now) ?? Date.now();
  const graceMs = Number.isFinite(input.graceMs) && (input.graceMs as number) > 0
    ? (input.graceMs as number)
    : DEFAULT_GRACE_PERIOD_MS;
  const status = isKnownSubscriptionStatus(input.subscriptionStatus)
    ? input.subscriptionStatus
    : SUBSCRIPTION_STATUS.NONE;

  if (status === SUBSCRIPTION_STATUS.PAST_DUE) {
    const since = toMillis(input.pastDueSince) ?? now;
    const endsAtMs = since + graceMs;
    return {
      active: now < endsAtMs,
      readsAllowed: true,
      writesAllowed: false,
      endsAt: new Date(endsAtMs).toISOString(),
    };
  }

  const writesAllowed = status === SUBSCRIPTION_STATUS.ACTIVE || status === SUBSCRIPTION_STATUS.TRIALING;
  return { active: false, readsAllowed: true, writesAllowed };
}
