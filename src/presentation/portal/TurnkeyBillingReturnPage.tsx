import { useEffect, useState, type ReactNode } from 'react';
import type { BillingAdapter } from '../../domain/interfaces';
import { NoopNavigationStrategy } from '../navigation/navigation.strategy';
import type { NavigationStrategy } from '../navigation/navigation.strategy';
import { PortalSpinner } from './components/PortalSpinner';

export interface TurnkeyBillingReturnPageProps {
  adapter: BillingAdapter;
  userId?: string;
  returnUrl?: string;
  navigation?: NavigationStrategy;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  loadingContent?: ReactNode;
}

function browserNavigation(): NavigationStrategy {
  if (typeof window === 'undefined') return new NoopNavigationStrategy();
  return {
    redirect(url: string): void {
      window.location.href = url;
    },
  };
}

export function TurnkeyBillingReturnPage({
  adapter,
  userId = '',
  returnUrl = '/billing',
  navigation,
  onSuccess,
  onError,
  loadingContent,
}: TurnkeyBillingReturnPageProps) {
  const [, setSynced] = useState(false);
  const nav = navigation ?? browserNavigation();

  useEffect(() => {
    let active = true;
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const checkoutId = searchParams.get('checkout_id') ?? searchParams.get('checkoutId') ?? undefined;

    adapter
      .syncSubscription(userId, checkoutId)
      .then(() => {
        if (!active) return;
        setSynced(true);
        onSuccess?.();
        nav.redirect(returnUrl);
      })
      .catch((err) => {
        if (!active) return;
        onError?.(err instanceof Error ? err : new Error(String(err)));
        nav.redirect(returnUrl);
      });

    return () => {
      active = false;
    };
  }, [adapter, userId, returnUrl, nav, onSuccess, onError]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, width: '100%' }}>
      {loadingContent ?? <PortalSpinner />}
    </div>
  );
}
