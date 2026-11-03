export {
  BillingClient,
  PolarBillingClient,
  createPaymentClient,
  SANDBOX_API_BASE_URL,
} from './infrastructure/services/billing.client';
export type {
  BillingClientConfig,
  PaymentClientConfig,
  PaymentServerClient,
  CheckoutSessionParams,
  CheckoutSession,
  CheckoutMetadata,
  CreateProductParams,
  CreatedProduct,
  SubscriptionRecord,
  PortalSession,
} from './infrastructure/services/billing.client';

export {
  PAYMENT_PROVIDER,
  PAYMENT_PROVIDER_VALUES,
  isKnownPaymentProvider,
} from './domain/enums/payment-provider.enum';
export type { PaymentProvider } from './domain/enums/payment-provider.enum';

export {
  DEFAULT_WEBHOOK_TOLERANCE_MS,
  verifyWebhook,
  verifyPolarWebhook,
} from './infrastructure/webhook/verify-webhook';
export type {
  WebhookHeadersLike,
  VerifyWebhookOptions,
} from './infrastructure/webhook/verify-webhook';

export {
  parseWebhookEvent,
  parsePolarWebhookEvent,
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

export {
  createBillingClient,
  createPolarClient,
  sandboxEnabled,
} from './infrastructure/services/create-billing-client';

export {
  buildCheckoutMetadata,
  readCheckoutMetadata,
} from './infrastructure/utils/checkout-metadata';
export type {
  BuildCheckoutMetadataInput,
  CheckoutOrderMetadata,
} from './infrastructure/utils/checkout-metadata';

export { formatReceiptNumber } from './infrastructure/utils/receipt.util';

