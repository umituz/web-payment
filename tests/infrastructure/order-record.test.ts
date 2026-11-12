import { describe, it, expect } from 'vitest';
import { buildPaidOrderRecord } from '../../src/infrastructure/utils/order-record';
import { formatReceiptNumber } from '../../src/infrastructure/utils/receipt.util';

describe('buildPaidOrderRecord', () => {
  const input = {
    orderId: 'chk_9f2a7b1c3d5e',
    userId: 'user_1',
    itemType: 'subscription_plan',
    itemId: 'plus',
    amount: 9,
    paymentMethod: 'polar',
    createdAt: '2026-11-12T12:00:00.000Z',
  };

  it('builds a paid record with a receipt number', () => {
    const record = buildPaidOrderRecord(input);
    expect(record).toEqual({
      id: 'chk_9f2a7b1c3d5e',
      userId: 'user_1',
      itemType: 'subscription_plan',
      itemId: 'plus',
      amount: 9,
      paymentMethod: 'polar',
      status: 'paid',
      receiptNumber: formatReceiptNumber('chk_9f2a7b1c3d5e'),
      createdAt: '2026-11-12T12:00:00.000Z',
    });
  });

  it('renames the amount field when requested', () => {
    const record = buildPaidOrderRecord(input, { amountField: 'amountUsd' });
    expect(record.amountUsd).toBe(9);
    expect(record.amount).toBeUndefined();
  });
});
