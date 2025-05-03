export function filterBySelect<T extends object>(
  user: T,
  select: Record<string, boolean>,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key in select) {
    if (select[key] && key in user) {
      result[key] = user[key];
    }
  }
  return result;
}
