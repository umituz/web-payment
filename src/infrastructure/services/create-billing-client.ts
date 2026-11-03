import { BillingClient, PolarBillingClient } from './billing.client';

export function sandboxEnabled(raw: string | boolean | undefined): boolean {
  if (typeof raw === 'boolean') return raw;
  return raw === 'true';
}

export function createPolarClient(config: {
  apiToken: string | undefined;
  sandbox?: string | boolean | undefined;
}): PolarBillingClient {
  return new PolarBillingClient({
    apiToken: config.apiToken ?? '',
    ...(sandboxEnabled(config.sandbox) ? { sandbox: true } : {}),
  });
}

export function createBillingClient(config: {
  apiToken: string | undefined;
  sandbox?: string | boolean | undefined;
}): BillingClient {
  return createPolarClient(config);
}
