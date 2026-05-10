export interface PurchaseItemRequest {
  productId: number;
  quantity: number;
}

export interface PurchaseRequest {
  supplierId: number;
  items: PurchaseItemRequest[];
}

export interface PurchaseItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface PurchaseResponse {
  id: number;
  supplierId: number;
  supplierName?: string;
  status: 'PENDING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELED';
  totalAmount: number;
  confirmedById?: number;
  confirmedByName?: string;
  confirmedAt?: string;
  createdAt?: string;
  items: PurchaseItemResponse[];
}