
import { useEffect, useMemo, useState } from 'react';
import type { BillingAdapter } from '../../domain/interfaces';
import type { BillingCycle } from '../../domain/entities';
import type { Product } from '../../domain/entities';
import { NoopNavigationStrategy } from '../navigation/navigation.strategy';
import type { NavigationStrategy } from '../navigation/navigation.strategy';
import { useBilling } from './hooks';
import { BillingPage, PlanComparison, PortalButton, PortalSpinner } from './components';
import { transformProducts } from './utils';
import type { BillingLabelsOverrides } from './labels';
import type { BillingConfig, PlanTier } from './types';
import { createPortalClient } from './create-portal-client';

export interface TurnkeyBillingPageProps {
  adapter: BillingAdapter;
  products: Product[];
  config: Omit<BillingConfig, 'plans'> & { plans?: PlanTier[] };
  userId?: string;
  defaultCycle?: BillingCycle;
  successUrl?: string;
  navigation?: NavigationStrategy;
  locale?: string;
  labels?: BillingLabelsOverrides;
  onError?: (error: Error) => void;
}

function browserNavigation(): NavigationStrategy {
  if (typeof window === 'undefined') return new NoopNavigationStrategy();
  return {
    redirect(url: string): void {
      window.location.href = url;
    },
  };
}

export function TurnkeyBillingPage({
  adapter,
  products,
  config,
  userId,
  defaultCycle,
  successUrl,
  navigation,
  locale,
  labels,
  onError,
}: TurnkeyBillingPageProps) {
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle ?? 'monthly');
  const [selecting, setSelecting] = useState(false);

  const client = useMemo(
    () =>
      createPortalClient({
        adapter,
        products,
        ...(userId !== undefined ? { userId } : {}),
        ...(defaultCycle !== undefined ? { defaultCycle } : {}),
        ...(successUrl !== undefined ? { successUrl } : {}),
        navigation: navigation ?? browserNavigation(),
      }),
    [adapter, products, userId, defaultCycle, successUrl, navigation],
  );

  const { billing, isLoading, error, loadBilling, cancelSubscription } = useBilling({ apiClient: client });

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const plans = config.plans ?? transformProducts(products);

  const selectPlan = async (productId: string) => {
    setSelecting(true);
    try {
      await client.selectPlan(productId, cycle);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setSelecting(false);
    }
  };

  const openPortalSafely = async () => {
    try {
      await client.openPortal();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const viewInvoice = async (invoiceId: string) => {
    try {
      await client.getInvoiceUrl(invoiceId);
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const mergedConfig: BillingConfig = { ...config, plans };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      <PlanComparison
        plans={plans}
        selectedPlan={billing?.subscription.plan.id}
        cycle={cycle}
        onPlanSelect={(productId) => void selectPlan(productId)}
        onCycleChange={setCycle}
        loading={selecting}
        labels={labels}
      />

      {billing ? (
        <BillingPage
          config={mergedConfig}
          billing={billing}
          loading={isLoading}
          error={error ?? undefined}
          locale={locale}
          labels={labels}
          onAddPaymentMethod={() => void openPortalSafely()}
          onSetDefaultPaymentMethod={() => void openPortalSafely()}
          onRemovePaymentMethod={() => void openPortalSafely()}
          onViewInvoice={(invoice) => void viewInvoice(invoice.id)}
          onCancelSubscription={() => cancelSubscription().then(() => loadBilling())}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32 }}>
          {isLoading ? (
            <PortalSpinner />
          ) : error ? (
            <>
              <span>{error}</span>
              <PortalButton onClick={() => void loadBilling()}>Retry</PortalButton>
            </>
          ) : (
            <PortalSpinner />
          )}
        </div>
      )}
    </div>
  );
}
