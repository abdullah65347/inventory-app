export interface CustomerRequest {
    name: string;
    phone: string;
    email?: string;
    address?: string;
}

export interface CustomerResponse {
    id: number;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    createdAt: string;
}