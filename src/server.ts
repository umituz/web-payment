export {
  BillingClient,
  SANDBOX_API_BASE_URL,
} from './infrastructure/services/billing.client';
export type {
  BillingClientConfig,
  CheckoutSessionParams,
  CheckoutSession,
  CheckoutMetadata,
  CreateProductParams,
  CreatedProduct,
  SubscriptionRecord,
  PortalSession,
} from './infrastructure/services/billing.client';

export {
  DEFAULT_WEBHOOK_TOLERANCE_MS,
  verifyWebhook,
} from './infrastructure/webhook/verify-webhook';
export type {
  WebhookHeadersLike,
  VerifyWebhookOptions,
} from './infrastructure/webhook/verify-webhook';

export {
  parseWebhookEvent,
  asCheckoutCompleted,
  asSubscriptionChanged,
  asOrderPaid,
} from './infrastructure/webhook/parse-event';
export type {
  WebhookEvent,
  CheckoutCompleted,
  SubscriptionChanged,
  OrderPaid,
} from './infrastructure/webhook/parse-event';

export { BillingApiError, isBillingApiError } from './infrastructure/services/product.repository';
export { API_BASE_URL } from './infrastructure/constants/billing.constants';

export {
  CHECKOUT_ID_PARAM,
  CHECKOUT_ID_PLACEHOLDER,
  parseProductIds,
  productIdOf,
  successUrlWithCheckoutId,
} from './infrastructure/config/billing-env';
export type { ProductIdMap } from './infrastructure/config/billing-env';

export { createBillingClient, sandboxEnabled } from './infrastructure/services/create-billing-client';

export { readCheckoutMetadata } from './infrastructure/utils/checkout-metadata';
export type { CheckoutOrderMetadata } from './infrastructure/utils/checkout-metadata';
