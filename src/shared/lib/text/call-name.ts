const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

export const callName = (name: string) => {
  const trimmed = name.trim();
  const last = trimmed.charCodeAt(trimmed.length - 1);
  if (!trimmed || last < HANGUL_START || last > HANGUL_END) return trimmed;
  return `${trimmed}${(last - HANGUL_START) % 28 ? "아" : "야"}`;
};
