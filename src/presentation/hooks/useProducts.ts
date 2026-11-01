
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllProducts } from '../../infrastructure/services/product.repository';
import type { Product, ProductListParams } from '../../domain/entities/product.entity';

export interface UseProductsOptions {
  apiToken: string;
  organizationId?: string;
  isRecurring?: boolean;
  enabled?: boolean;
}

export interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useProducts(options: UseProductsOptions): UseProductsResult {
  const { apiToken, organizationId, isRecurring = true, enabled = true } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const optionsRef = useRef({ apiToken, organizationId, isRecurring, enabled });
  optionsRef.current = { apiToken, organizationId, isRecurring, enabled };

  const abortRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async (): Promise<void> => {
    const { apiToken: token, organizationId: org, isRecurring: recurring, enabled: isEnabled } =
      optionsRef.current;

    abortRef.current?.abort();

    if (!isEnabled) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const params: ProductListParams = { isRecurring: recurring };
      if (org) params.organizationId = org;

      const data = await getAllProducts({ apiToken: token }, params, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      setProducts(data);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
    return () => {
      abortRef.current?.abort();
    };
  }, [apiToken, organizationId, isRecurring, enabled, fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}
