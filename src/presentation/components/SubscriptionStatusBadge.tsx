
import { useMemo } from 'react';
import { useBilling } from '../context/billing-context';
import type { SubscriptionStatus } from '../../domain/entities/subscription.entity';
import type { SubscriptionStatusValue } from '../../domain/enums/subscription-status.enum';
import { StatusTone } from '../utils/status-tone';
import { StatusLabel } from '../utils/status-label';
import { DateRenderer } from '../../infrastructure/utils/date-renderer';
import { VisualTokens, TONE_PAIRS } from '../theme/visual-tokens';

export interface SubscriptionStatusBadgeProps {
  status?: SubscriptionStatus;
  loading?: boolean;
  locale?: string;
  labels?: SubscriptionStatusBadgeLabels;
}

export interface SubscriptionStatusBadgeLabels {
  loading?: string;
  endsPrefix?: string;
  statuses?: Partial<Record<SubscriptionStatusValue, string>>;
}

const DEFAULT_LABELS: Required<Omit<SubscriptionStatusBadgeLabels, 'statuses'>> = Object.freeze({
  loading: 'Loading…',
  endsPrefix: 'ends',
});

export function SubscriptionStatusBadge({
  status: statusOverride,
  loading: loadingOverride,
  locale,
  labels,
}: SubscriptionStatusBadgeProps) {
  const ctx = useBilling();
  const status = statusOverride ?? ctx.status;
  const loading = loadingOverride ?? ctx.loading;

  const dateRenderer = useMemo(() => new DateRenderer(locale), [locale]);
  const text = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );

  const pillStyle = useMemo<React.CSSProperties>(
    () => ({
      padding: `${VisualTokens.spacing.xs}px ${VisualTokens.spacing.lg - 2}px`,
      borderRadius: VisualTokens.radius.pill,
      fontSize: VisualTokens.fontSize.caption,
      fontWeight: VisualTokens.fontWeight.strong,
    }),
    [],
  );

  if (loading) {
    return (
      <span
        style={{
          ...pillStyle,
          ...TONE_PAIRS.neutral,
        }}
      >
        {text.loading}
      </span>
    );
  }

  const tone = StatusTone.forStatus(status.subscriptionStatus);
  const color = TONE_PAIRS[tone];
  const label = StatusLabel.forStatus(status.subscriptionStatus, labels?.statuses);

  const showPlan = status.plan && status.plan !== 'free';
  const showEnds = status.cancelAtPeriodEnd;
  const endsLabel = showEnds
    ? `${text.endsPrefix} ${dateRenderer.renewal(status.currentPeriodEnd)}`
    : null;

  return (
    <span
      aria-label={`Subscription ${label}`}
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        padding: pillStyle.padding,
        borderRadius: VisualTokens.radius.pill,
        fontSize: VisualTokens.fontSize.caption,
        fontWeight: VisualTokens.fontWeight.strong,
        display: 'inline-flex',
        alignItems: 'center',
        gap: VisualTokens.spacing.xs + 2,
      }}
    >
      <span style={{ textTransform: 'capitalize' }}>{label}</span>
      {showPlan ? (
        <span style={{ opacity: VisualTokens.opacity.muted }}>· {status.plan}</span>
      ) : null}
      {endsLabel ? (
        <span style={{ opacity: VisualTokens.opacity.muted }}>· {endsLabel}</span>
      ) : null}
    </span>
  );
}
