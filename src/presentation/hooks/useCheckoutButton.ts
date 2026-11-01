
import { useCallback, useState } from 'react';
import type { CheckoutParams } from '../../domain/entities/checkout.entity';
import { useBilling } from '../context/billing-context';

export interface UseCheckoutButtonOptions {
  productId: string;
  billingCycle?: CheckoutParams['billingCycle'];
  successUrl?: string;
  planKey?: string;
  onError?: (error: Error) => void;
}

export interface UseCheckoutButtonResult {
  start: () => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useCheckoutButton(
  options: UseCheckoutButtonOptions,
): UseCheckoutButtonResult {
  const { startCheckout } = useBilling();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { productId, billingCycle, successUrl, planKey, onError } = options;

  const start = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await startCheckout({
        productId,
        billingCycle,
        successUrl,
        planKey,
      });
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      setError(normalized);
      onError?.(normalized);
    } finally {
      setLoading(false);
    }
  }, [startCheckout, productId, billingCycle, successUrl, planKey, onError]);

  return { start, loading, error };
}
