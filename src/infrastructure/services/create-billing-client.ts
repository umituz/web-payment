import { BillingClient } from './billing.client';

export function sandboxEnabled(raw: string | boolean | undefined): boolean {
  if (typeof raw === 'boolean') return raw;
  return raw === 'true';
}

export function createBillingClient(config: {
  apiToken: string | undefined;
  sandbox: string | boolean | undefined;
}): BillingClient {
  return new BillingClient({
    apiToken: config.apiToken ?? '',
    ...(sandboxEnabled(config.sandbox) ? { sandbox: true } : {}),
  });
}
