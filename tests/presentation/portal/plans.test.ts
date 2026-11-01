
import { describe, it, expect } from 'vitest';
import type { Product, ProductPrice } from '../../../src/domain/entities';
import {
  transformProductToPlan,
  transformProducts,
} from '../../../src/presentation/portal/utils/plans';

const price = (overrides?: Partial<ProductPrice>): ProductPrice => ({
  id: 'price_1',
  type: 'fixed',
  amountType: 'fixed',
  amount: 1200,
  currency: 'USD',
  recurringInterval: 'monthly',
  isArchived: false,
  productId: 'prod_1',
  ...overrides,
});

const product = (overrides?: Partial<Product>): Product => ({
  id: 'prod_1',
  name: 'Pro',
  description: 'Everything you need',
  isRecurring: true,
  recurringInterval: 'monthly',
  isArchived: false,
  organizationId: 'org_1',
  prices: [price()],
  benefits: [
    { id: 'b1', type: 'custom', description: 'Unlimited seats', properties: {} },
    { id: 'b2', type: 'custom', description: null, properties: {} },
  ],
  metadata: {},
  createdAt: '2026-01-01T00:00:00Z',
  modifiedAt: null,
  ...overrides,
});

describe('transformProductToPlan', () => {
  it('projects a monthly price into a PlanTier', () => {
    const plan = transformProductToPlan(product(), price());
    expect(plan).toMatchObject({
      id: 'prod_1',
      name: 'Pro',
      description: 'Everything you need',
      monthlyPrice: 1200,
      yearlyPrice: 14400, // 1200 × 12
      currency: 'USD',
    });
  });

  it('normalizes a yearly price to its monthly equivalent and keeps the yearly figure', () => {
    const plan = transformProductToPlan(
      product(),
      price({ amount: 12000, recurringInterval: 'yearly' }),
    );
    expect(plan.monthlyPrice).toBe(1000);
    expect(plan.yearlyPrice).toBe(12000);
  });

  it('turns benefits into the feature list, dropping empty descriptions', () => {
    const plan = transformProductToPlan(product(), price());
    expect(plan.features).toEqual(['Unlimited seats']);
  });

  it('throws on an unsupported currency', () => {
    expect(() =>
      transformProductToPlan(product(), price({ currency: 'XAU' })),
    ).toThrow(/Unsupported currency/);
  });

  it('throws on a price without a recurring interval (one-time price)', () => {
    expect(() =>
      transformProductToPlan(product(), price({ recurringInterval: undefined })),
    ).toThrow(/unsupported interval/);
  });
});

describe('transformProducts', () => {
  it('skips archived products and archived prices', () => {
    const plans = transformProducts([
      product({ id: 'archived_prod', isArchived: true }),
      product({
        id: 'prod_ok',
        prices: [price({ isArchived: true }), price({ id: 'price_ok' })],
      }),
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0].id).toBe('prod_ok');
  });

  it('emits one tier per product, pairing both real prices', () => {
    const plans = transformProducts([
      product({
        prices: [
          price({ id: 'p_month', amount: 1000, recurringInterval: 'monthly' }),
          price({ id: 'p_year', amount: 9000, recurringInterval: 'yearly' }),
        ],
      }),
    ]);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ id: 'prod_1', monthlyPrice: 1000, yearlyPrice: 9000 });
  });

  it('keeps the real yearly discount instead of deriving the yearly figure', () => {
    const plans = transformProducts([
      product({
        prices: [
          price({ id: 'p_month', amount: 1000, recurringInterval: 'monthly' }),
          price({ id: 'p_year', amount: 9000, recurringInterval: 'yearly' }),
        ],
      }),
    ]);
    expect(plans[0].yearlyPrice).toBe(9000);
    expect(plans[0].monthlyPrice).toBe(1000);
  });

  it('derives the missing figure for a single-priced product', () => {
    const monthlyOnly = transformProducts([
      product({ prices: [price({ recurringInterval: 'monthly' })] }),
    ]);
    expect(monthlyOnly).toHaveLength(1);
    expect(monthlyOnly[0].monthlyPrice).toBe(1200);
    expect(monthlyOnly[0].yearlyPrice).toBe(14400);

    const yearlyOnly = transformProducts([
      product({ prices: [price({ amount: 12000, recurringInterval: 'yearly' })] }),
    ]);
    expect(yearlyOnly).toHaveLength(1);
    expect(yearlyOnly[0].monthlyPrice).toBe(1000);
    expect(yearlyOnly[0].yearlyPrice).toBe(12000);
  });

  it('skips products with no recurring price', () => {
    const plans = transformProducts([
      product({ prices: [price({ recurringInterval: undefined })] }),
    ]);
    expect(plans).toHaveLength(0);
  });
});
