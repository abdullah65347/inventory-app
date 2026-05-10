export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'CREDIT';

export interface SaleItemRequest {
  productId: number;
  quantity: number;
}

export interface SaleRequest {
  soldById: number;
  customerId: number;
  paymentMode: PaymentMode;
  items: SaleItemRequest[];
}

export interface SaleItemResponse {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  soldById: number;
  soldByName: string;
  soldByRole: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paymentMode: PaymentMode;
  saleDate: string;
  items: SaleItemResponse[];
}