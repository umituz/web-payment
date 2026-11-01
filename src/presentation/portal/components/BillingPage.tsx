
import { BillingLayout, BillingPortal } from '.';
import type { BillingConfig, BillingPageProps } from '../types';
import { DEFAULT_BILLING_CONFIG } from '../constants';
import { BillingLabelsProvider } from '../labels';

export const BillingPage = ({ config, labels, ...portalProps }: BillingPageProps) => {
  const mergedConfig: BillingConfig = {
    ...DEFAULT_BILLING_CONFIG,
    ...config,
  };

  return (
    <BillingLabelsProvider labels={labels}>
      <BillingLayout config={mergedConfig}>
        <BillingPortal showTabs {...portalProps} />
      </BillingLayout>
    </BillingLabelsProvider>
  );
};

export default BillingPage;
