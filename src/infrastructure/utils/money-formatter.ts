
import { minorUnitDivisor } from '../../domain/utils/minor-units';

const DEFAULT_LOCALE = 'en-US';
const DEFAULT_CURRENCY = 'USD';

export interface MoneyFormatOptions {
  locale?: string;
  fallbackCurrency?: string;
  maximumFractionDigits?: number;
}

export class MoneyFormatter {
  private readonly locale: string;

  constructor(locale: string = DEFAULT_LOCALE) {
    this.locale = locale;
  }

  format(
    amount: number | undefined,
    currency: string | undefined,
    options: MoneyFormatOptions = {},
  ): string {
    if (amount === undefined || amount === null) {
      return 'Custom';
    }
    const code = (currency ?? options.fallbackCurrency ?? DEFAULT_CURRENCY).toUpperCase();
    try {
      return new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
      }).format(amount / minorUnitDivisor(code));
    } catch {
      return `${amount} ${code}`;
    }
  }
}
