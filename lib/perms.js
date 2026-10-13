const P = {
  SUPER_ADMIN: '*',
  ADMIN: ['products', 'stock', 'images', 'queries', 'stats', 'orders', 'payments', 'customers'],
  EDITOR: ['products', 'images', 'content'],
}
export const can = (u, perm) => P[u.role] === '*' || P[u.role].includes(perm)
export const ROLE_LABEL = { SUPER_ADMIN: 'Super Admin', ADMIN: 'Administrador', EDITOR: 'Editor' }
