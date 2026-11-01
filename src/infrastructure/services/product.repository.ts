
import {
  API_BASE_URL,
  API_MAX_PAGE_SIZE,
} from '../constants/billing.constants';
import { HttpClient } from '../http/http-client';
import { FetchHttpClient } from '../http/http-client';
import { QueryBuilder } from '../query/query-builder';
import { PageIterator, type Page, type PageFetcher } from '../pagination/page-iterator';
import { PaginationClamp } from '../utils/pagination-clamp';
import {
  mapProduct,
  mapProductList,
  type Product,
  type ProductDto,
  type ProductListParams,
  type ProductListResponse,
} from '../../domain/mappers/product.mapper';

export interface ProductApiConfig {
  apiToken: string;
  baseUrl?: string;
}

export interface ProductRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class BillingApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = 'BillingApiError';
    Object.setPrototypeOf(this, BillingApiError.prototype);
  }
}

export function isBillingApiError(error: unknown): error is BillingApiError {
  return error instanceof BillingApiError;
}

interface RawProductPage {
  items: ProductDto[];
  pagination: { total_count: number; max_page: number };
}

export class ProductRepository {
  private readonly http: HttpClient;
  private readonly apiToken: string;
  private readonly baseUrl: string;

  constructor(config: ProductApiConfig, http: HttpClient = new FetchHttpClient()) {
    this.http = http;
    this.apiToken = config.apiToken;
    this.baseUrl = config.baseUrl ?? API_BASE_URL;
  }

  async list(
    params?: ProductListParams,
    options?: ProductRequestOptions,
  ): Promise<ProductListResponse> {
    const query = new QueryBuilder({
      organization_id: params?.organizationId,
      is_recurring: params?.isRecurring,
      page: params?.page,
      limit: this.clampLimit(params?.limit),
    });
    const url = `${this.baseUrl}/products?${query.toString()}`;

    const response = await this.http.request<RawProductPage>({
      method: 'GET',
      url,
      headers: this.authHeaders(),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new BillingApiError(
        `Billing API error: ${response.status}`,
        response.status,
        body,
      );
    }

    return mapProductList(response.data);
  }

  async findById(
    productId: string,
    options?: ProductRequestOptions,
  ): Promise<Product | null> {
    const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}`;

    const response = await this.http.request<ProductDto>({
      method: 'GET',
      url,
      headers: this.authHeaders(),
      signal: options?.signal,
      timeoutMs: options?.timeoutMs,
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      const body = await response.text();
      throw new BillingApiError(
        `Billing API error: ${response.status}`,
        response.status,
        body,
      );
    }

    if (!response.data) {
      throw new BillingApiError(
        'Billing API returned an empty product body',
        response.status,
      );
    }

    return mapProduct(response.data);
  }

  iterateAll(
    params?: Omit<ProductListParams, 'page' | 'limit'>,
    options: { limit?: number; signal?: AbortSignal } = {},
  ): AsyncIterable<Product> {
    const limit = this.clampLimit(options.limit);
    const fetcher: PageFetcher<Product> = {
      fetchPage: async (page, pageLimit) => {
        const response = await this.list(
          { ...params, page, limit: pageLimit },
          { signal: options.signal },
        );
        const pageData: Page<Product> = {
          items: response.items,
          page,
          totalCount: response.pagination.totalCount,
          maxPage: response.pagination.maxPage,
          isLast: page >= response.pagination.maxPage,
        };
        return pageData;
      },
    };
    return new PageIterator(fetcher, { limit, signal: options.signal });
  }

  async listAll(
    params?: Omit<ProductListParams, 'page' | 'limit'>,
    options: { limit?: number; signal?: AbortSignal } = {},
  ): Promise<Product[]> {
    const out: Product[] = [];
    for await (const product of this.iterateAll(params, options)) {
      out.push(product);
    }
    return out;
  }


  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiToken}` };
  }

  private clampLimit(limit: number | undefined): number | undefined {
    return PaginationClamp.pageSize(limit, API_MAX_PAGE_SIZE);
  }
}


const defaultClient = new FetchHttpClient();

export async function getProducts(
  config: ProductApiConfig,
  params?: ProductListParams,
  options?: ProductRequestOptions,
): Promise<ProductListResponse> {
  return new ProductRepository(config, defaultClient).list(params, options);
}

export async function getProductById(
  config: ProductApiConfig,
  productId: string,
  options?: ProductRequestOptions,
): Promise<Product | null> {
  return new ProductRepository(config, defaultClient).findById(productId, options);
}

export async function getAllProducts(
  config: ProductApiConfig,
  params?: Omit<ProductListParams, 'page' | 'limit'>,
  options: { limit?: number; signal?: AbortSignal } = {},
): Promise<Product[]> {
  return new ProductRepository(config, defaultClient).listAll(params, options);
}
