
import type { ProductPrice, Product } from '../../../domain/entities';
import type { PlanTier } from '../types';
import { CURRENCY, type Currency } from '../constants';

const MONTHS_IN_YEAR = 12;

const KNOWN_CURRENCIES: ReadonlySet<string> = new Set(Object.values(CURRENCY));

const productFeatures = (product: Product): string[] =>
  product.benefits
    .map((benefit) => benefit.description ?? '')
    .filter((description) => description.length > 0);

const toCurrency = (raw: string): Currency => {
  const upper = raw.toUpperCase();
  if (KNOWN_CURRENCIES.has(upper)) return upper as Currency;
  throw new Error(`Unsupported currency: ${raw}`);
};

const toMonthlyAmount = (amount: number, interval: string | undefined): number => {
  if (interval === 'monthly') return amount;
  if (interval === 'yearly') return amount / MONTHS_IN_YEAR;
  throw new Error(
    `Cannot convert price to monthly: unsupported interval "${interval ?? 'undefined'}"`,
  );
};

export function transformProductToPlan(product: Product, price: ProductPrice): PlanTier {
  const interval = price.recurringInterval;
  const monthlyAmount = toMonthlyAmount(price.amount ?? 0, interval);
  const yearlyAmount = interval === 'yearly' ? price.amount ?? 0 : (price.amount ?? 0) * MONTHS_IN_YEAR;

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? '',
    monthlyPrice: Math.round(monthlyAmount),
    yearlyPrice: Math.round(yearlyAmount),
    currency: toCurrency(price.currency),
    features: productFeatures(product),
  };
}

export function transformProducts(products: Product[]): PlanTier[] {
  const tiers: PlanTier[] = [];
  for (const product of products) {
    if (product.isArchived) continue;
    const recurring = product.prices.filter(
      (price) => !price.isArchived && price.recurringInterval !== undefined,
    );
    const monthly = recurring.find((price) => price.recurringInterval === 'monthly');
    const yearly = recurring.find((price) => price.recurringInterval === 'yearly');
    if (monthly && yearly) {
      tiers.push({
        id: product.id,
        name: product.name,
        description: product.description ?? '',
        monthlyPrice: Math.round(monthly.amount ?? 0),
        yearlyPrice: Math.round(yearly.amount ?? 0),
        currency: toCurrency(monthly.currency),
        features: productFeatures(product),
      });
    } else if (monthly) {
      tiers.push(transformProductToPlan(product, monthly));
    } else if (yearly) {
      tiers.push(transformProductToPlan(product, yearly));
    }
  }
  return tiers;
}
