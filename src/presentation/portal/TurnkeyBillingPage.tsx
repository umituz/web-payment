import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
import { DEFAULT_BILLING_CONFIG } from './constants';
import { createPortalClient } from './create-portal-client';

export interface TurnkeyBillingPageProps {
  adapter: BillingAdapter;
  products?: Product[];
  config?: Partial<BillingConfig> & { brandName?: string; plans?: PlanTier[] };
  userId?: string;
  defaultCycle?: BillingCycle;
  successUrl?: string;
  navigation?: NavigationStrategy;
  locale?: string;
  labels?: BillingLabelsOverrides;
  fallback?: ReactNode;
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
  fallback,
  onError,
}: TurnkeyBillingPageProps) {
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle ?? 'monthly');
  const [selecting, setSelecting] = useState(false);

  const effectiveProducts = useMemo(() => products ?? [], [products]);
  const plans = useMemo(
    () => config?.plans ?? transformProducts(effectiveProducts),
    [config?.plans, effectiveProducts],
  );

  const client = useMemo(
    () =>
      createPortalClient({
        adapter,
        products: effectiveProducts,
        ...(userId !== undefined ? { userId } : {}),
        ...(defaultCycle !== undefined ? { defaultCycle } : {}),
        ...(successUrl !== undefined ? { successUrl } : {}),
        navigation: navigation ?? browserNavigation(),
      }),
    [adapter, effectiveProducts, userId, defaultCycle, successUrl, navigation],
  );

  const { billing, isLoading, error, loadBilling, cancelSubscription } = useBilling({ apiClient: client });

  useEffect(() => {
    if (plans.length > 0) {
      void loadBilling();
    }
  }, [loadBilling, plans.length]);

  if (plans.length === 0) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div
        style={{
          padding: 24,
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#f9fafb',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Checkout not configured</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          Billing configuration or product tiers are not set on this deployment. Plan changes stay available through the platform console until configured.
        </div>
      </div>
    );
  }

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

  const mergedConfig: BillingConfig = {
    brandName: config?.brandName ?? 'Billing & Subscription',
    ...DEFAULT_BILLING_CONFIG,
    ...config,
    plans,
  };

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
