
import type { BillingCycle, Product, ProductPrice } from '../../domain/entities';

export const FALLBACK_PRICE_LABEL = 'Custom';

export class ProductPricing {
  static recurringPrice(product: Product, cycle?: BillingCycle): ProductPrice | null {
    const recurring = product.prices.filter(
      (p) => p.recurringInterval !== undefined,
    );
    if (recurring.length === 0) {
      return product.prices[0] ?? null;
    }
    if (cycle) {
      const match = recurring.find((p) => p.recurringInterval === cycle);
      if (match) return match;
    }
    return recurring[0] ?? null;
  }

  static displayLine(
    product: Product,
    formatter: (amount: number | undefined, currency: string | undefined) => string,
    cycle?: BillingCycle,
  ): { amount: string; interval: string | null } {
    const price = ProductPricing.recurringPrice(product, cycle);
    if (!price) {
      return { amount: FALLBACK_PRICE_LABEL, interval: null };
    }
    const amount = formatter(price.amount, price.currency);
    return { amount, interval: price.recurringInterval ?? null };
  }
}
