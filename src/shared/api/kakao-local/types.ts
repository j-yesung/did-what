export type KakaoPlace = {
  address: string | null;
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  parcelAddress: string | null;
};

export type KakaoRegion = {
  code: string;
  fullName: string;
  latitude: number;
  longitude: number;
  name: string;
};

export type KakaoRegionSearchResult =
  | {
      regions: KakaoRegion[];
      related: boolean;
    }
  | {
      error: string;
    };

/**
 * 장소 검색을 좁히는 기준점. 행정 경계가 아니라 거리로 좁힌다.
 * 같은 시 안에서도 옆 동이 안 나오거나, 바로 옆 시·군에 잠깐 들른 곳이 빠지는 걸 막는다.
 */
export type KakaoSearchScope = {
  latitude: number;
  longitude: number;
};
