# 다음 단계: 홈 발자취 지도 실제 기록 연결

## 목적

홈의 고정 mock 위치를 현재 사용자의 `records → places` 좌표 조회로 교체해 실제 기록이 대한민국 활동 지도 농도에 반영되게 한다.

이번 단계는 홈 지도 데이터 연결과 빈 상태까지만 구현한다. 지도 셀 클릭, 지역 상세, 기간 필터는 실제 사용 데이터가 쌓인 뒤 추가한다.

## 완료 조건

- 로그인한 사용자의 기록 위치만 홈 지도에 표시된다.
- 같은 지도 cell의 기록 수가 기존 0~4단계 농도로 집계된다.
- 새 기록을 저장하고 홈으로 돌아오면 해당 장소 좌표가 지도에 반영된다.
- 기록이 없을 때 mock 발자취가 보이지 않고 명확한 빈 상태를 제공한다.
- 조회 실패 시 가짜 데이터 대신 한국어 오류 안내를 표시한다.
- 지도 접근성 설명이 실제 기록 수에 맞게 바뀐다.

## 데이터 조회

`HomePage`를 async Server Component로 바꾸고 다음 필드만 조회한다.

```text
records: id
places: latitude, longitude
```

예상 관계 조회:

```text
records
└── place:places(latitude, longitude)
```

- `getUser()`로 현재 사용자를 확인한다.
- `owner_id = user.id`와 기존 RLS를 함께 적용한다.
- 별도 client fetch, 전역 store, API route는 만들지 않는다.
- record 전체나 장소명처럼 지도 계산에 쓰지 않는 필드는 조회하지 않는다.

## 지도 모델 정리

- `MockRecordLocation`을 도메인 중립적인 `RecordLocation`으로 바꾼다.
- `KoreaActivityMap`은 `records` prop으로 좌표 배열을 받는다.
- `createKoreaMap(records)`의 기존 cell 집계 알고리즘과 농도 기준은 유지한다.
- `mock-record-locations.ts`와 관련 import를 삭제한다.
- 대한민국 기본 grid 생성은 record와 무관하므로 모듈 단위에서 한 번만 계산해 재사용한다.

농도 기준은 기존 값을 유지한다.

```text
0개 → level 0
1개 → level 1
2~3개 → level 2
4~6개 → level 3
7개 이상 → level 4
```

## UI

- 현재 Forest Green 지도 디자인과 모바일 390px 구성을 유지한다.
- 기록이 있으면 지도 아래에 전체 기록 수를 짧게 표시한다.
- 기록이 없으면 빈 지도와 함께 첫 기록 CTA를 제공한다.
- 조회 오류는 shadcn/ui `Alert`로 표시한다.
- 빈 상태는 shadcn/ui `Empty`를 재사용한다.
- CTA와 내비게이션 아이콘은 기존 Lucide 아이콘을 유지한다.
- 지도 `<title>`과 `<desc>`에서 특정 mock 도시명을 제거하고 실제 기록 수를 설명한다.

## 구조

```text
app → _pages → shared
```

- `app/(app)/page.tsx`는 `HomePage`만 렌더링하는 얇은 진입점으로 유지한다.
- 조회와 화면 조립은 `_pages/home`에 둔다.
- 지도 계산은 기존 `_pages/home/lib/korea-map.ts`를 재사용한다.
- 한 화면에서만 쓰는 repository나 hook은 만들지 않는다.

## 보안

- Server Component에서 인증된 사용자 ID를 다시 확인한다.
- record 조회에 owner 필터와 RLS를 함께 적용한다.
- 다른 사용자의 places 좌표가 join 결과에 포함되지 않는지 확인한다.
- 조회 오류 원문을 사용자에게 노출하지 않는다.

## 제외 범위

- 지도 cell 클릭과 툴팁
- 지역별 기록 목록
- 기간 필터
- 사람별 지도 필터
- 지도 확대와 이동
- 실제 Kakao 지도 SDK
- region/district 기반 집계
- SQL aggregation, view, materialized view
- 기록 실시간 구독

## 검증

- 기록 0개 지도와 빈 상태
- 한 cell에 1개, 2개, 4개, 7개 기록 농도
- 서로 다른 장소의 서로 다른 cell 배치
- 다른 사용자 데이터 격리
- 새 기록 저장 후 홈 revalidate 확인
- mock 데이터와 import 완전 제거
- 접근성 title/description 확인
- Biome import/format check
- lint
- TypeScript type check
- production build
- Supabase Security Advisor

## 완료 후 다음 플랜

실제 발자취 지도가 연결되면 `/records/[recordId]` placeholder를 실제 기록 상세 화면에 연결하고, 기록 목록에서 상세로 이동하는 흐름을 구현한다.
