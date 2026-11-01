
export interface HttpRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface HttpResponse<T> {
  status: number;
  ok: boolean;
  data: T | null;
  text(): Promise<string>;
}

export interface HttpClient {
  request<T>(request: HttpRequest): Promise<HttpResponse<T>>;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export class FetchHttpClient implements HttpClient {
  async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
    const init: RequestInit = {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(request.headers ?? {}),
      },
    };
    if (request.body !== undefined) {
      (init as RequestInit & { body: string }).body = JSON.stringify(request.body);
      (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort();
    if (request.signal) {
      if (request.signal.aborted) controller.abort();
      else request.signal.addEventListener('abort', forwardAbort);
    }
    init.signal = controller.signal;

    let response: Response;
    try {
      response = await fetch(request.url, init);
    } catch (error) {
      if (timedOut && error instanceof Error && error.name === 'AbortError') {
        throw new DOMException(`Request timed out after ${timeoutMs}ms`, 'TimeoutError');
      }
      throw error;
    } finally {
      clearTimeout(timer);
      request.signal?.removeEventListener('abort', forwardAbort);
    }

    const bodyText = await response.text();

    let data: T | null = null;
    if (bodyText.length > 0) {
      try {
        data = JSON.parse(bodyText) as T;
      } catch {
        data = null;
      }
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      text: async () => bodyText,
    };
  }
}
