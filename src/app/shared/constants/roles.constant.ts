export const ROLES = {
  ADMIN: 'ROLE_ADMIN',
  SUPPLIER: 'ROLE_SUPPLIER',
  MANAGER: 'ROLE_MANAGER',
  STAFF: 'ROLE_STAFF',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];