import { ROLES, Role } from '../../shared/constants/roles.constant';

export function roleLabel(role: Role | string): string {
  const m: Record<string, string> = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.SUPPLIER]: 'Supplier',
    [ROLES.MANAGER]: 'Manager',
    [ROLES.STAFF]: 'Staff',
    [ROLES.NEW_USER]: 'New_User'

  };
  return m[role] ?? role;
}

export function roleBadgeClass(role: Role | string): string {
  const m: Record<string, string> = {
    [ROLES.ADMIN]: 'badge-danger',
    [ROLES.SUPPLIER]: 'badge-secondary',
    [ROLES.MANAGER]: 'badge-warning',
    [ROLES.STAFF]: 'badge-primary',
    [ROLES.NEW_USER]: 'badge-muted'
  };
  return m[role] ?? 'badge-muted';
}

export function initials(name: string): string {
  return name?.trim()?.charAt(0)?.toUpperCase() || '';
}

export function statusBadge(status: string): string {
  const m: Record<string, string> = {
    PENDING: 'badge-warning',
    DELIVERED: 'badge-info',
    CONFIRMED: 'badge-success',
    CANCELLED: 'badge-danger',
    CANCELED: 'badge-danger',
    ACTIVE: 'badge-success',
    INACTIVE: 'badge-danger',
  };
  return m[status] ?? 'badge-muted';
}

export function paymentModeBadge(mode: string): string {
  const m: Record<string, string> = {
    CASH: 'badge-success',
    CARD: 'badge-primary',
    UPI: 'badge-secondary',
    CREDIT: 'badge-warning',
  };
  return m[mode] ?? 'badge-muted';
}