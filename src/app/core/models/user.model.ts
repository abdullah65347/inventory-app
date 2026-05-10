import { Role } from '../../shared/constants/roles.constant';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  role: Role;
}