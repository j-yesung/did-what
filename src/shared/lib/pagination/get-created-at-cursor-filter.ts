export const getCreatedAtCursorFilter = (cursor: { createdAt: string; id: number | string }) =>
  `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
