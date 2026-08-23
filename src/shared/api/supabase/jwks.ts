/** 현재 서명 키는 로컬 검증하고, 키가 회전되면 Supabase SDK가 새 키를 다시 조회한다. */
export const SUPABASE_JWKS = {
  keys: [
    {
      alg: "ES256",
      crv: "P-256",
      ext: true,
      key_ops: ["verify"],
      kid: "d36145a9-2b63-4de3-8e65-36d006ae293f",
      kty: "EC",
      use: "sig",
      x: "YW_opz9JtEnk-lEpoAd3nQX4UgisisyW5AGC-WVZED0",
      y: "NFGArkFfVBa0QDiiiMEEA3V0uqcOYYkrfZ5W8dbQH_I",
    },
  ],
};
