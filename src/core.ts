
export {
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_VALUES,
  isKnownSubscriptionStatus,
} from './domain/enums/subscription-status.enum';
export type { SubscriptionStatusValue } from './domain/enums/subscription-status.enum';

export {
  BILLING_CYCLE,
  BILLING_CYCLE_VALUES,
  isKnownBillingCycle,
  parseBillingCycle,
} from './domain/enums/billing-cycle.enum';
export type { BillingCycle } from './domain/enums/billing-cycle.enum';

export { POLAR_AMOUNT_TYPE } from './domain/enums/amount-type.enum';
export type { AmountType } from './domain/enums/amount-type.enum';

export {
  CANCELLATION_REASON,
  CANCELLATION_REASON_VALUES,
} from './domain/entities/cancellation.entity';
export type { CancellationReason, CancelResult } from './domain/entities/cancellation.entity';

export { FREE_SUBSCRIPTION_STATUS, isActiveSubscription } from './domain/entities/subscription.entity';
export type { SubscriptionStatus } from './domain/entities/subscription.entity';
export type { CheckoutParams, CheckoutResult } from './domain/entities/checkout.entity';
export type { OrderItem } from './domain/entities/order.entity';
export type { SyncResult } from './domain/entities/sync.entity';
export type {
  Product,
  ProductPrice,
  ProductBenefit,
  ProductListResponse,
  ProductListParams,
  RecurringInterval,
  PriceType,
} from './domain/entities/product.entity';

export type { BillingAdapter } from './domain/interfaces';
export { createMemoryBillingAdapter } from './infrastructure/services/memory/create-memory-adapter';
export type { MemoryAdapterConfig } from './infrastructure/services/memory/create-memory-adapter';

export { mapProduct, mapProductList } from './domain/mappers/product.mapper';
export type {
  ProductDto,
  ProductPriceDto,
  ProductBenefitDto,
  ProductListResponseDto,
} from './domain/mappers/product.mapper';

export {
  minorUnitDivisor,
  toMajorUnits,
  toMinorUnits,
} from './domain/utils/minor-units';

export {
  applyPercentDiscount,
  normalizeCouponCode,
} from './domain/utils/percent-discount';
