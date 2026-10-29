import "server-only";

const RETRY_MESSAGE = "주소 검색에 실패했어요. 잠시 후 다시 시도해 주세요.";

export class HomeAddressLocationError extends Error {}

export const geocodeHomeAddress = async (address: string, signal?: AbortSignal) => {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("주소 검색을 사용할 수 없어요.");
  const url = new URL("https://dapi.kakao.com/v2/local/search/address.json");
  url.searchParams.set("query", address);
  url.searchParams.set("size", "2");
  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!response?.ok) throw new Error(RETRY_MESSAGE);
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== "object" || !("documents" in data) || !Array.isArray(data.documents)) {
    throw new Error(RETRY_MESSAGE);
  }
  if (data.documents.length !== 1)
    throw new HomeAddressLocationError(
      "주소를 찾지 못했거나 여러 곳이 검색돼요. 도로명과 건물 번호까지 입력해 주세요.",
    );
  const item = data.documents[0];
  const longitude = Number(item?.x);
  const latitude = Number(item?.y);
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < 124 ||
    longitude > 132 ||
    latitude < 33 ||
    latitude > 39
  ) {
    throw new HomeAddressLocationError("대한민국의 주소를 입력해 주세요.");
  }
  return { latitude, longitude };
};
