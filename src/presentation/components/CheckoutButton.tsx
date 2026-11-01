
import { useMemo } from 'react';
import { useCheckoutButton } from '../hooks/useCheckoutButton';
import type { CheckoutParams } from '../../domain/entities/checkout.entity';
import { CheckoutButtonVisual } from '../utils/checkout-button-visual';
import { InlineErrorVisual } from '../utils/inline-error-visual';

export type CheckoutButtonVariant = 'primary' | 'secondary' | 'danger';

export interface CheckoutButtonLabels {
  loading?: string;
}

export interface CheckoutButtonProps {
  productId: string;
  billingCycle?: CheckoutParams['billingCycle'];
  successUrl?: string;
  planKey?: string;
  label: string;
  variant?: CheckoutButtonVariant;
  disabled?: boolean;
  onError?: (error: Error) => void;
  className?: string;
  labels?: CheckoutButtonLabels;
}

const DEFAULT_LABELS: Required<CheckoutButtonLabels> = Object.freeze({
  loading: 'Redirecting…',
});

export function CheckoutButton({
  productId,
  billingCycle,
  successUrl,
  planKey,
  label,
  variant = 'primary',
  disabled = false,
  onError,
  className,
  labels,
}: CheckoutButtonProps) {
  const { start, loading, error } = useCheckoutButton({
    productId,
    billingCycle,
    successUrl,
    planKey,
    onError,
  });

  const style = useMemo(
    () => CheckoutButtonVisual.resolve({ variant, disabled, loading }),
    [variant, disabled, loading],
  );

  const text = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button
        type="button"
        style={style}
        className={className}
        onClick={() => void start()}
        disabled={disabled || loading}
        aria-busy={loading}
      >
        {loading ? text.loading : label}
      </button>
      {InlineErrorVisual.element(error?.message)}
    </span>
  );
}
