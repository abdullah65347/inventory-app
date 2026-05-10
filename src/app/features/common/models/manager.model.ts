export interface ManagerRequest {
    userId: number;
    department: string;
}

export interface ManagerResponse {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    department: string;
    active: boolean;
    createdAt: string;
}