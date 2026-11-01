
export class QueryBuilder {
  private readonly params: URLSearchParams;

  constructor(initial?: Record<string, string | number | boolean | undefined | null>) {
    this.params = new URLSearchParams();
    if (initial) this.setMany(initial);
  }

  set(key: string, value: string | number | boolean | undefined | null): this {
    if (value === undefined || value === null) return this;
    this.params.set(key, String(value));
    return this;
  }

  setMany(values: Record<string, string | number | boolean | undefined | null>): this {
    for (const [key, value] of Object.entries(values)) {
      this.set(key, value);
    }
    return this;
  }

  toString(): string {
    return this.params.toString();
  }
}
