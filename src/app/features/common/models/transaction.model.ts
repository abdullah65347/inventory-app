export interface TransactionRequest {
  productId: number;
  transactionType: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
}
export interface TransactionResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
  quantity: number;
  createdAt: string;
}
