// supplier.model.ts
export interface SupplierRequest {
  userId: number;
  categoryId: number;
  companyName: string;
  address: string;
}
export interface SupplierResponse {
  id: number;
  userId: number;
  userName: string;
  categoryId: number;
  categoryName: string;
  companyName: string;
  address: string;
  active: boolean;
  createdAt: string;
}
