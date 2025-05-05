export function isAdminUser(user?: { role?: string }): boolean {
  if (!user) return false;
  return user?.role === 'Admin' || user?.role === 'Super';
}
