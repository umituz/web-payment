import { formatReceiptNumber } from './receipt.util';

export interface BuildPaidOrderRecordInput {
  orderId: string;
  userId: string;
  itemType: string;
  itemId: string;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}

export interface BuildPaidOrderRecordOptions {
  amountField?: string;
}

export type PaidOrderRecord = Record<string, string | number>;

export function buildPaidOrderRecord(
  input: BuildPaidOrderRecordInput,
  options: BuildPaidOrderRecordOptions = {},
): PaidOrderRecord {
  const amountField = options.amountField ?? 'amount';
  return {
    id: input.orderId,
    userId: input.userId,
    itemType: input.itemType,
    itemId: input.itemId,
    [amountField]: input.amount,
    paymentMethod: input.paymentMethod,
    status: 'paid',
    receiptNumber: formatReceiptNumber(input.orderId),
    createdAt: input.createdAt,
  };
}
