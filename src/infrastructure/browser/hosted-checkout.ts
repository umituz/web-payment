import { CHECKOUT_ID_PARAM } from '../config/billing-env';
import { isInsecureUrl, isLoopbackHost } from '../utils/security.util';

export function isSafeCheckoutUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  if (url.startsWith('https://')) return true;
  return isInsecureUrl(url) && isLoopbackHost(url);
}

export function redirectToHostedCheckout(url: string): void {
  if (!isSafeCheckoutUrl(url)) throw new Error('invalid_checkout_url');
  window.location.assign(url);
}

export function checkoutIdFromLocationSearch(search: string): string | null {
  const withoutLeading = search.startsWith('?') ? search.slice(1) : search;
  for (const pair of withoutLeading.split('&')) {
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    if (pair.slice(0, separator) !== CHECKOUT_ID_PARAM) continue;
    const value = pair.slice(separator + 1);
    if (value.length === 0) return null;
    return decodeURIComponent(value);
  }
  return null;
}
