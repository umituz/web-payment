
const MINOR_UNIT_DIVISOR = 100;

const ZERO_DECIMAL_CURRENCIES: ReadonlySet<string> = new Set([
  'JPY', 'KRW', 'VND', 'CLP', 'PYG', 'XAF', 'XOF', 'BIF', 'DJF', 'GNF', 'XPF',
]);

export function minorUnitDivisor(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? 1
    : MINOR_UNIT_DIVISOR;
}

export function toMajorUnits(amount: number, currency: string): number {
  return amount / minorUnitDivisor(currency);
}

export function toMinorUnits(amount: number, currency: string): number {
  return Math.round(amount * minorUnitDivisor(currency));
}
