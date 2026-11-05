/**
 * Id-ordered cursor pages. Routes query `{ where: { ...tenantScope, ...afterCursor(cursor) },
 * orderBy: { id: 'asc' }, take: limit + 1 }` and pass the rows here.
 */
export const afterCursor = (cursor: string | undefined) => (cursor ? { id: { gt: cursor } } : {});

export function toPage<T extends { id: string }>(rows: T[], limit: number) {
  const data = rows.slice(0, limit);
  const last = data.at(-1);
  return { data, page: { nextCursor: rows.length > limit && last ? last.id : null } };
}
