export interface OrderItem {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  productName?: string;
  itemType?: string;
  itemId?: string;
  amountUsd?: number;
  receiptNumber?: string;
  invoiceUrl?: string;
}

