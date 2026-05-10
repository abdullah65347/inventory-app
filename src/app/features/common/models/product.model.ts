export interface ProductRequest {
  name: string;
  description: string;
  supplierToAdminPrice: number;
  quantity: number;
  supplierId: number;
  sku: string;
}

export interface SupplierProductResponse {
  id: number;
  name: string;
  description: string;
  supplierToAdminPrice: number;
  availableStock: number;
  sku: string;
  createdAt: string;
  active: boolean;
}

export interface AdminProductResponse {
  id: number;
  name: string;
  description: string;
  supplierToAdminPrice: number;
  adminToUserPrice: number;
  availableStock: number;
  categoryName: string;
  supplierName: string;
  sku: string;
  createdAt: string;
  active: boolean;
}

export interface UserProductResponse {
  id: number;
  name: string;
  description: string;
  adminToUserPrice: number;
}
