
import type { AmountType } from '../enums/amount-type.enum';
import { parseBillingCycle, type BillingCycle } from '../enums/billing-cycle.enum';


export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  is_recurring: boolean;
  recurring_interval: string | null;
  is_archived: boolean;
  organization_id: string;
  prices: ProductPriceDto[];
  benefits: ProductBenefitDto[];
  metadata: Record<string, unknown>;
  created_at: string;
  modified_at: string | null;
}

export interface ProductPriceDto {
  id: string;
  type: string;
  amount_type: string;
  amount?: number;
  currency: string;
  recurring_interval?: string;
  is_archived: boolean;
  product_id: string;
  legacy?: boolean;
}

export interface ProductBenefitDto {
  id: string;
  type: string;
  description: string | null;
  properties: Record<string, unknown>;
}

export interface ProductListResponseDto {
  items: ProductDto[];
  pagination: {
    total_count: number;
    max_page: number;
  };
}


export interface ProductPrice {
  id: string;
  type: AmountType;
  amountType: AmountType;
  amount?: number;
  currency: string;
  recurringInterval?: BillingCycle;
  isArchived: boolean;
  productId: string;
  legacy?: boolean;
}

export interface ProductBenefit {
  id: string;
  type: string;
  description: string | null;
  properties: Record<string, unknown>;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  recurringInterval: BillingCycle | null;
  isArchived: boolean;
  organizationId: string;
  prices: ProductPrice[];
  benefits: ProductBenefit[];
  metadata: Record<string, unknown>;
  createdAt: string;
  modifiedAt: string | null;
}

export interface ProductListResponse {
  items: Product[];
  pagination: {
    totalCount: number;
    maxPage: number;
  };
}

export interface ProductListParams {
  organizationId?: string;
  isRecurring?: boolean;
  page?: number;
  limit?: number;
}


const KNOWN_AMOUNT_TYPES: ReadonlySet<string> = new Set([
  'fixed',
  'custom',
  'free',
  'seat_based',
  'metered_unit',
]);

function toAmountType(raw: string | undefined): AmountType {
  if (raw && KNOWN_AMOUNT_TYPES.has(raw)) return raw as AmountType;
  return 'fixed';
}

function toBillingCycle(interval: string | null | undefined): BillingCycle | null {
  return parseBillingCycle(interval);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function toPrice(dto: ProductPriceDto): ProductPrice {
  return {
    id: String(dto.id),
    type: toAmountType(dto.type),
    amountType: toAmountType(dto.amount_type),
    amount: typeof dto.amount === 'number' ? dto.amount : undefined,
    currency: String(dto.currency),
    recurringInterval: toBillingCycle(dto.recurring_interval) ?? undefined,
    isArchived: Boolean(dto.is_archived),
    productId: String(dto.product_id),
    legacy: Boolean(dto.legacy),
  };
}

function toBenefit(dto: ProductBenefitDto): ProductBenefit {
  return {
    id: String(dto.id),
    type: String(dto.type),
    description: dto.description ?? null,
    properties: asRecord(dto.properties),
  };
}

export function mapProduct(dto: ProductDto | null | undefined): Product {
  if (!dto || typeof dto !== 'object') {
    throw new TypeError('mapProduct: expected a product DTO object');
  }
  return {
    id: String(dto.id),
    name: String(dto.name),
    description: dto.description ?? null,
    isRecurring: Boolean(dto.is_recurring),
    recurringInterval: toBillingCycle(dto.recurring_interval),
    isArchived: Boolean(dto.is_archived),
    organizationId: String(dto.organization_id),
    prices: Array.isArray(dto.prices) ? dto.prices.map(toPrice) : [],
    benefits: Array.isArray(dto.benefits) ? dto.benefits.map(toBenefit) : [],
    metadata: asRecord(dto.metadata),
    createdAt: String(dto.created_at),
    modifiedAt: dto.modified_at ?? null,
  };
}

export function mapProductList(
  dto: ProductListResponseDto | null | undefined,
): ProductListResponse {
  if (!dto || typeof dto !== 'object') {
    return { items: [], pagination: { totalCount: 0, maxPage: 1 } };
  }
  return {
    items: Array.isArray(dto.items) ? dto.items.map(mapProduct) : [],
    pagination: {
      totalCount: Number(dto.pagination?.total_count ?? 0),
      maxPage: Number(dto.pagination?.max_page ?? 1),
    },
  };
}
