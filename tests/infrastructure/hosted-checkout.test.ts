import { describe, it, expect, vi } from 'vitest';
import {
  checkoutIdFromLocationSearch,
  isSafeCheckoutUrl,
  redirectToHostedCheckout,
} from '../../src/infrastructure/browser/hosted-checkout';

describe('isSafeCheckoutUrl', () => {
  it('accepts https and localhost http, rejects the rest', () => {
    expect(isSafeCheckoutUrl('https://checkout.example.com/session/1')).toBe(true);
    expect(isSafeCheckoutUrl('http://localhost:3000/checkout')).toBe(true);
    expect(isSafeCheckoutUrl('http://127.0.0.1:8787/checkout')).toBe(true);
    expect(isSafeCheckoutUrl('http://evil.example.com/checkout')).toBe(false);
    expect(isSafeCheckoutUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeCheckoutUrl('')).toBe(false);
  });
});

describe('redirectToHostedCheckout', () => {
  it('navigates to a safe url', () => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { assign } });
    redirectToHostedCheckout('https://checkout.example.com/session/1');
    expect(assign).toHaveBeenCalledWith('https://checkout.example.com/session/1');
    vi.unstubAllGlobals();
  });

  it('throws instead of navigating to an unsafe url', () => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { assign } });
    expect(() => redirectToHostedCheckout('http://evil.example.com')).toThrow('invalid_checkout_url');
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('checkoutIdFromLocationSearch', () => {
  it('reads the checkout id from a search string', () => {
    expect(checkoutIdFromLocationSearch('?checkout_id=chk_123')).toBe('chk_123');
    expect(checkoutIdFromLocationSearch('?lang=tr&checkout_id=chk_9')).toBe('chk_9');
    expect(checkoutIdFromLocationSearch('checkout_id=chk_1')).toBe('chk_1');
  });

  it('returns null when absent or empty', () => {
    expect(checkoutIdFromLocationSearch('?other=1')).toBeNull();
    expect(checkoutIdFromLocationSearch('?checkout_id=')).toBeNull();
    expect(checkoutIdFromLocationSearch('')).toBeNull();
  });
});
