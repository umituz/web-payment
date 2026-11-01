
import { useMemo } from 'react';
import { useProducts } from '../hooks/useProducts';
import type { Product, BillingCycle } from '../../domain/entities';
import { CheckoutButton } from './CheckoutButton';
import { ProductPricing } from '../utils/product-pricing';
import { MoneyFormatter } from '../../infrastructure/utils/money-formatter';
import { VisualTokens } from '../theme/visual-tokens';

export interface PricingTableProps {
  products?: Product[];
  apiToken?: string;
  organizationId?: string;
  isRecurring?: boolean;
  ctaLabel?: string;
  onError?: (error: Error) => void;
  filterInterval?: BillingCycle | null;
  locale?: string;
  labels?: PricingTableLabels;
}

export interface PricingTableLabels {
  loading?: string;
  empty?: string;
  errorPrefix?: string;
  retry?: string;
}

const DEFAULT_LABELS: Required<PricingTableLabels> = Object.freeze({
  loading: 'Loading pricing…',
  empty: 'No products available.',
  errorPrefix: 'Failed to load pricing:',
  retry: 'Retry',
});

export function PricingTable({
  products: productsOverride,
  apiToken,
  organizationId,
  isRecurring = true,
  ctaLabel = 'Subscribe',
  onError,
  filterInterval = 'monthly',
  locale,
  labels,
}: PricingTableProps) {
  const enabled = productsOverride === undefined && apiToken !== undefined;
  const { products: fetchedProducts, loading, error, refetch } = useProducts({
    apiToken: apiToken ?? '',
    organizationId,
    isRecurring,
    enabled,
  });

  const products = productsOverride ?? fetchedProducts;

  const moneyFormatter = useMemo(() => new MoneyFormatter(locale), [locale]);
  const text = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );

  const visible = useMemo(() => {
    if (filterInterval === null) return products;
    return products.filter((p) => p.recurringInterval === filterInterval);
  }, [products, filterInterval]);

  if (enabled && loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          padding: VisualTokens.spacing.section,
          textAlign: 'center',
        }}
      >
        {text.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        style={{
          padding: VisualTokens.spacing.xl,
          background: VisualTokens.color.surfaceDanger,
          borderRadius: VisualTokens.radius.md,
        }}
      >
        <p style={{ margin: 0, color: VisualTokens.color.brandDangerText }}>
          {text.errorPrefix} {error.message}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          style={{ marginTop: VisualTokens.spacing.md, padding: '6px 12px' }}
        >
          {text.retry}
        </button>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div
        style={{
          padding: VisualTokens.spacing.section,
          textAlign: 'center',
          color: VisualTokens.color.textMuted,
        }}
      >
        {text.empty}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${VisualTokens.layout.cardMinWidth}px, 1fr))`,
        gap: VisualTokens.spacing.xl,
      }}
    >
      {visible.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          moneyFormatter={moneyFormatter}
          ctaLabel={ctaLabel}
          onError={onError}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  moneyFormatter: MoneyFormatter;
  ctaLabel: string;
  onError?: (error: Error) => void;
}

function ProductCard({ product, moneyFormatter, ctaLabel, onError }: ProductCardProps) {
  const { amount, interval } = useMemo(
    () =>
      ProductPricing.displayLine(
        product,
        (amt, cur) => moneyFormatter.format(amt, cur),
      ),
    [product, moneyFormatter],
  );

  return (
    <article
      style={{
        border: `1px solid ${VisualTokens.color.borderSubtle}`,
        borderRadius: VisualTokens.radius.lg,
        padding: VisualTokens.spacing.xxl,
        display: 'flex',
        flexDirection: 'column',
        gap: VisualTokens.spacing.lg,
      }}
    >
      <header>
        <h3 style={{ margin: 0, fontSize: VisualTokens.fontSize.title }}>{product.name}</h3>
        {product.description ? (
          <p
            style={{
              margin: `${VisualTokens.spacing.xs}px 0 0`,
              color: VisualTokens.color.textMuted,
              fontSize: VisualTokens.fontSize.body,
            }}
          >
            {product.description}
          </p>
        ) : null}
      </header>

      <div style={{ fontSize: VisualTokens.fontSize.display, fontWeight: VisualTokens.fontWeight.strong }}>
        {amount}
        {interval ? (
          <span
            style={{
              fontSize: VisualTokens.fontSize.body,
              fontWeight: VisualTokens.fontWeight.regular,
              color: VisualTokens.color.textMuted,
            }}
          >
            {' '}/ {interval}
          </span>
        ) : null}
      </div>

      {product.benefits.length > 0 ? (
        <ul
          style={{
            paddingLeft: 18,
            margin: 0,
            color: '#374151',
            fontSize: VisualTokens.fontSize.body,
          }}
        >
          {product.benefits.slice(0, VisualTokens.layout.benefitListMax).map((b) => (
            <li key={b.id}>{b.description ?? b.type}</li>
          ))}
        </ul>
      ) : null}

      <div style={{ marginTop: 'auto' }}>
        <CheckoutButton
          productId={product.id}
          billingCycle={product.recurringInterval ?? undefined}
          label={ctaLabel}
          onError={onError}
        />
      </div>
    </article>
  );
}
