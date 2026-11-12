import { describe, it, expect } from 'vitest';
import {
  CURRENCIES,
  CURRENCY_CONFIGS,
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_LANGUAGE_CURRENCY_MAP,
  convertAmount,
  currencyForLanguage,
  isSupportedCurrency,
  isZeroDecimalCurrency,
} from '../../src/domain/utils/currency';

describe('currency catalog', () => {
  it('supports the six shipped currencies', () => {
    expect(CURRENCIES).toHaveLength(6);
    expect(isSupportedCurrency('USD')).toBe(true);
    expect(isSupportedCurrency('usd')).toBe(true);
    expect(isSupportedCurrency('INVALID')).toBe(false);
    expect(isSupportedCurrency(42)).toBe(false);
  });

  it('flags zero-decimal currencies consistently with minor units', () => {
    expect(isZeroDecimalCurrency('KRW')).toBe(true);
    expect(isZeroDecimalCurrency('jpy')).toBe(true);
    expect(isZeroDecimalCurrency('USD')).toBe(false);
    expect(CURRENCY_CONFIGS.KRW.isZeroDecimal).toBe(true);
    expect(CURRENCY_CONFIGS.GBP.isZeroDecimal).toBe(false);
  });

  it('exposes a config for every supported currency', () => {
    for (const code of CURRENCIES) {
      const config = CURRENCY_CONFIGS[code];
      expect(config.code).toBe(code);
      expect(config.symbol.length).toBeGreaterThan(0);
      expect(config.locale.length).toBeGreaterThan(0);
      expect(DEFAULT_EXCHANGE_RATES[code]).toBeGreaterThan(0);
    }
  });
});

describe('convertAmount', () => {
  it('returns the amount unchanged for the same currency', () => {
    expect(convertAmount(19.5, 'USD', 'USD')).toBe(19.5);
    expect(convertAmount(19.5)).toBe(19.5);
  });

  it('converts between currencies using benchmark rates', () => {
    expect(convertAmount(10, 'USD', 'EUR')).toBe(9);
    expect(convertAmount(9, 'EUR', 'USD')).toBe(10);
  });

  it('rounds zero-decimal targets to sensible billable steps', () => {
    expect(convertAmount(35, 'USD', 'KRW')).toBe(49000);
    expect(convertAmount(1, 'USD', 'JPY')).toBe(200);
  });

  it('normalizes non-canonical currency codes', () => {
    expect(convertAmount(35, 'USD', 'krw')).toBe(49000);
    expect(convertAmount(35, 'XYZ', 'USD')).toBe(35);
  });

  it('honors custom rates over the defaults', () => {
    expect(convertAmount(10, 'USD', 'TRY', { ...DEFAULT_EXCHANGE_RATES, TRY: 10 })).toBe(100);
  });
});

describe('currencyForLanguage', () => {
  it('maps interface languages to their default currency', () => {
    expect(currencyForLanguage('tr')).toBe('TRY');
    expect(currencyForLanguage('tr-TR')).toBe('TRY');
    expect(currencyForLanguage('de')).toBe('EUR');
    expect(currencyForLanguage('fr')).toBe('EUR');
    expect(currencyForLanguage('ko')).toBe('KRW');
    expect(currencyForLanguage('ja')).toBe('JPY');
    expect(currencyForLanguage('en')).toBe('USD');
  });

  it('falls back to USD for unmapped languages and empty input', () => {
    expect(currencyForLanguage('unknown')).toBe('USD');
    expect(currencyForLanguage()).toBe('USD');
  });

  it('accepts a custom language map', () => {
    const map = { ...DEFAULT_LANGUAGE_CURRENCY_MAP, zz: 'GBP' };
    expect(currencyForLanguage('zz', map)).toBe('GBP');
    expect(currencyForLanguage('zz')).toBe('USD');
    expect(currencyForLanguage('zz', { zz: 'bogus' })).toBe('USD');
  });
});
