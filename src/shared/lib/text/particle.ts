const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const RIEUL_FINAL = 8;

export const getDirectionParticle = (word: string) => {
  const code = word.charCodeAt(word.length - 1);
  if (code < HANGUL_START || code > HANGUL_END) return "로";

  const final = (code - HANGUL_START) % 28;
  return final === 0 || final === RIEUL_FINAL ? "로" : "으로";
};
