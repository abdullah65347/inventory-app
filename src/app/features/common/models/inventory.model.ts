export interface InventoryResponse {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  availableStock: number;
  reorderLevel: number;
  supplierId: number;
  supplierName: string;
  lastUpdated: string;
}
