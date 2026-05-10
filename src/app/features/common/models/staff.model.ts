export interface StaffRequest {
    userId: number;
    managerId?: number;
}

export interface StaffResponse {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    managerId?: number;
    managerName?: string;
    active: boolean;
    createdAt: string;
}