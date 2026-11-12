import { describe, it, expect } from 'vitest';
import {
  buildProductKey,
  parseProductKey,
  productKeyPrefix,
} from '../../src/domain/utils/product-key';

describe('parseProductKey', () => {
  it('parses prefix and id', () => {
    expect(parseProductKey('plan:plus')).toEqual({ prefix: 'plan', id: 'plus' });
    expect(parseProductKey('booking:one-on-one')).toEqual({ prefix: 'booking', id: 'one-on-one' });
  });

  it('parses a third segment as the variant', () => {
    expect(parseProductKey('tier:pro_10:yearly')).toEqual({
      prefix: 'tier',
      id: 'pro_10',
      variant: 'yearly',
    });
  });

  it('rejects malformed keys', () => {
    expect(parseProductKey('')).toBeNull();
    expect(parseProductKey('plan')).toBeNull();
    expect(parseProductKey(':plus')).toBeNull();
    expect(parseProductKey('plan:')).toBeNull();
    expect(parseProductKey('plan:plus:yearly:extra')).toBeNull();
    expect(parseProductKey('plan:plus year')).toBeNull();
  });
});

describe('buildProductKey', () => {
  it('round-trips through parse', () => {
    expect(buildProductKey('plan', 'exam-pro')).toBe('plan:exam-pro');
    expect(buildProductKey('tier', 'master_20', 'yearly')).toBe('tier:master_20:yearly');
    expect(parseProductKey(buildProductKey('tier', 'master_20', 'yearly'))).toEqual({
      prefix: 'tier',
      id: 'master_20',
      variant: 'yearly',
    });
  });
});

describe('productKeyPrefix', () => {
  it('returns the first segment or null', () => {
    expect(productKeyPrefix('pass:pass_10')).toBe('pass');
    expect(productKeyPrefix('bogus')).toBeNull();
  });
});
