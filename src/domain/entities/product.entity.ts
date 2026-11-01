
export type {
  Product,
  ProductPrice,
  ProductBenefit,
  ProductListResponse,
  ProductListParams,
} from '../mappers/product.mapper';

import type { BillingCycle } from '../enums/billing-cycle.enum';

export type RecurringInterval = 'day' | 'week' | 'month' | 'year';

export type PriceType = 'fixed' | 'custom' | 'free' | 'seat_based' | 'metered_unit';

export type { BillingCycle };
