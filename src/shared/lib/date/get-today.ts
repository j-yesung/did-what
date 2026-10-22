const KST_OFFSET = 9 * 60 * 60 * 1000;

export const getToday = (now = new Date()) => {
  return new Date(now.getTime() + KST_OFFSET).toISOString().slice(0, 10);
};
