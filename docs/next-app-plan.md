# 메인 탭 데이터를 TanStack Query로 통합

> 상태: 구현 및 검증 완료 (2026-08-16)
>
> 2026-08-24 커플 전용 방향으로 사람 관리 기능을 제거했다. 아래의 `people` 관련 내용은 전환 당시 구조를 설명하는 기록이다.

## 목표

로그인 후 메인 데이터를 한 번씩 병렬 조회하고 앱 세션 동안 TanStack Query 캐시에 보관한다. 하단 탭 전환에서는 같은 데이터를 다시 요청하지 않고, 사용자가 데이터를 변경했을 때만 관련 query를 무효화한다.

```text
앱 최초 진입
  ├─ records  ─┬─ 지도
  │            └─ 기록 목록
  ├─ people   ─── 사람 목록·기록 폼
  ├─ places   ─── 장소 목록·기록 폼
  └─ profile  ─── 설정

각 query를 한 번씩 병렬 요청
  → 모든 화면이 같은 메모리 캐시 사용
  → 변경된 query만 다시 조회
```

## 구현 결정

### 데이터 캐시의 단일 기준

- 메인 화면의 Server Component에서 실행하던 `getRecordLocations`, `getRecords`, `getPeople`, `getPlaces`, `getProfileName`을 제거했다.
- 앱 레이아웃의 `MainDataPrefetch`가 네 query를 동시에 준비한다.
- 실제 화면도 같은 query options를 `useQuery`로 사용한다. 현재 화면과 프리페처가 동시에 시작돼도 같은 query key의 요청은 하나로 합쳐진다.
- 하단 내비게이션은 `prefetch={true}`로 전체 RSC 화면 구조를 준비한다. 메인 RSC에는 Supabase 조회가 없으므로 데이터 요청과 중복되지 않는다.
- 상세 화면의 RSC 조회와 데이터 신뢰 경계인 서버 액션 검증은 그대로 유지한다.

### API 구조

새 `/api/app-data` Route Handler는 만들지 않았다. 이미 있는 Supabase 브라우저 클라이언트가 Data API를 직접 호출한다.

- 브라우저에는 publishable key만 사용한다.
- `records`, `people`, `places`, `profiles`는 기존 RLS의 `auth.uid()` 소유권 조건으로 보호한다.
- 클라이언트 SELECT에는 `owner_id` 필터를 넣지 않는다. 사용자 입력에 의존하지 않고 RLS가 소유 행을 제한한다.
- 테마는 Supabase 데이터가 아니라 쿠키이므로 기존 서버 처리를 유지한다.

## 호출과 캐시

정상적인 앱 최초 진입의 Supabase Data API 호출은 다음 네 건이다.

| query key | 데이터 | 소비 화면 |
| --- | --- | --- |
| `['records']` | 기록, 사람 이름, 지도 좌표 | 지도, 기록 |
| `['people']` | 함께한 사람 | 사람, 기록 작성·수정 |
| `['places']` | 저장한 장소와 연결 기록 수 | 장소, 기록 작성·수정 |
| `['profile']` | 표시 이름 | 설정 |

`records` SELECT에 지도 좌표를 포함해 기존 지도 전용 API 호출을 제거했다. 기록 검색·기간·정렬은 캐시된 배열에 적용한다.

메인 query에는 다음 정책을 공통 적용한다.

```ts
export const MAIN_QUERY_OPTIONS = {
  gcTime: Number.POSITIVE_INFINITY,
  staleTime: Number.POSITIVE_INFINITY,
} as const;
```

- 같은 앱 세션에서는 시간 경과나 창 포커스로 자동 재조회하지 않는다.
- 새로고침과 앱 재실행에서는 메모리 캐시가 사라져 다시 조회한다.
- 개인 데이터는 `localStorage`나 IndexedDB에 저장하지 않는다.
- 로그아웃 성공 시 `queryClient.clear()`로 이전 사용자의 캐시를 지운다.
- 네트워크 오류에서는 QueryClient 기본 정책에 따라 한 번 재시도할 수 있다.

## 핵심 코드

### 엔티티 query options

```ts
export const peopleQueryOptions = queryOptions({
  ...MAIN_QUERY_OPTIONS,
  queryKey: ["people"],
  queryFn: async () => {
    const { data, error } = await createClient()
      .from("people")
      .select("id, name, created_at")
      .order("name");

    if (error) throw error;
    return data;
  },
});
```

### 최초 병렬 프리페치

```tsx
export function MainDataPrefetch() {
  usePrefetchQuery(recordsQueryOptions);
  usePrefetchQuery(peopleQueryOptions);
  usePrefetchQuery(placesQueryOptions);
  usePrefetchQuery(profileQueryOptions);

  return null;
}
```

설치된 TanStack Query의 `usePrefetchQuery`를 그대로 사용한다. 별도의 effect, Promise 조정 코드나 전역 상태는 만들지 않았다.

### 화면 캐시 소비

```tsx
export function RecordList({ filters }: RecordListProps) {
  const records = useQuery(recordsQueryOptions);

  if (records.isPending) return <Spinner />;
  if (records.isError) return <LoadErrorAlert title="기록을 불러오지 못했어요" />;

  return <RecordTimeline records={filterRecords(records.data, filters)} />;
}
```

실제 코드는 기존 UI 구조를 유지하기 위해 현재 컴포넌트 안에서 Spinner와 목록을 조합한다. 전용 `RecordsContent`, `PlacesContent` 파일은 만들지 않았다.

### 변경 후 query 무효화

모든 서버 액션 mutation이 통과하는 `useActionMutation`에 선택적인 query key만 추가했다.

```ts
const create = useActionMutation(createPerson, {
  error: "추가하지 못했어요",
  invalidate: [peopleQueryOptions.queryKey],
});
```

| 변경 | 무효화 query |
| --- | --- |
| 기록 생성·수정·삭제 | `records`, `places` |
| 사람 생성 | `people` |
| 사람 이름 수정·삭제 | `people`, `records` |
| 장소 저장·삭제 | `places` |
| 로그아웃 | 전체 query cache |

기존 `revalidatePath`는 상세 RSC와 Next Router Cache 최신화를 위해 유지한다.

## 실제 변경 파일

### 새로 생성: 7개

| 파일 | 목적 |
| --- | --- |
| `src/entities/record/api/records-query.ts` | 지도와 목록이 공유하는 기록 query |
| `src/entities/person/api/people-query.ts` | 사람 query |
| `src/entities/place/api/places-query.ts` | 저장 장소 query |
| `src/entities/profile/api/profile-query.ts` | 프로필 query |
| `src/widgets/main-data-prefetch/index.ts` | 프리페처 공개 API |
| `src/widgets/main-data-prefetch/ui/main-data-prefetch.tsx` | 네 query 최초 프리페치 |
| `src/pages/settings/ui/settings-content.tsx` | 서버 이메일·테마와 클라이언트 프로필 경계 |

### 기존 파일에 합친 내용

- 기록 클라이언트 필터와 테스트는 기존 `record-filters.ts`, `record-filters.test.mjs`에 추가했다.
- 기록 타입은 `records-query.ts`의 반환 타입에서 추론한다.
- 기록 목록 query는 기존 `record-list.tsx`가 소비한다.
- 장소 query는 기존 `saved-place-list.tsx`, `place-search-results.tsx`가 소비한다.
- 기록 작성·수정 선택지는 기존 `RecordForm`이 사람·장소 query를 직접 소비한다.
- pending 화면은 기존 `Spinner`를 필요한 위치에 조합한다.

## 예상 동작

### 첫 진입

1. 서버 레이아웃은 로그인 확인을 `Suspense` 안에서 진행하고 로딩 화면을 먼저 스트리밍한다.
2. 로그인 확인이 끝나면 메인 화면 구조가 렌더링된다.
3. `records`, `people`, `places`, `profile` 요청이 병렬로 한 번씩 시작된다.
4. 현재 화면 데이터가 도착할 때까지 Spinner를 바로 표시한다.

### 탭 전환

1. 하단 탭을 누르면 `prefetch={true}`로 준비한 전체 RSC 화면 구조로 즉시 전환한다.
2. 프리페치가 완료된 데이터는 TanStack Query 캐시에서 동기적으로 나온다.
3. Supabase Data API를 다시 호출하지 않고 콘텐츠 진입 모션만 실행한다.

### 데이터 변경

1. 서버 액션이 인증·입력·소유권을 다시 검증하고 DB를 변경한다.
2. 성공한 mutation이 관련 query만 무효화한다.
3. 현재 사용 중인 query는 즉시 다시 받고, 비활성 query는 다음 화면 진입 때 받는다.
4. 관계없는 query는 그대로 유지한다.

### 검색과 상세

- 기록 필터는 전체 기록 캐시를 클라이언트에서 검색·기간 필터·정렬한다.
- Kakao 장소·지역 검색은 검색 버튼을 눌렀을 때만 호출한다.
- 기록·사람·장소 상세는 메인 프리페치에 포함하지 않고 진입할 때만 RSC로 조회한다.

## 범위와 한계

- 현재 기록 규모가 작다는 전제로 전체 기록을 한 번 조회한다.
- 페이지네이션이나 무한 스크롤을 도입하면 `records` query를 필터·페이지 key로 분리하고 지도 집계를 다시 독립시킨다.
- 다른 기기의 변경은 자동 반영하지 않는다. 새로고침하면 최신 데이터를 다시 받는다.
- Client Component 범위는 데이터 소비 영역으로 제한했다.

## 완료 조건과 검증

- 정상 첫 진입에서 네 메인 Data API가 각각 한 번만 호출된다.
- 지도와 기록이 하나의 `records` 응답을 공유한다.
- 프리페치 뒤 탭을 왕복해도 메인 Data API가 다시 호출되지 않는다.
- 기록·사람·장소 변경 뒤 관련 query만 다시 호출된다.
- 검색 버튼을 누르기 전에는 Kakao 검색 요청이 없다.
- 로그아웃 뒤 이전 사용자의 query cache가 남지 않는다.
- 브라우저 Supabase 클라이언트에서 다른 사용자의 행을 읽을 수 없다.

검증 명령과 프로덕션 브라우저 확인은 `docs/verification.md` 기준으로 수행한다.

### 검증 결과

- 프로덕션 첫 진입에서 Supabase Data API 요청은 `records`, `people`, `places`, `profile` 각 한 번씩 총 네 건 발생했다.
- 이후 지도 → 기록 → 장소 탭을 이동해도 네 Data API는 다시 호출되지 않았다.
- 기록 검색 폼은 Next 라우터로 전환되어 검색 버튼을 눌러도 문서와 TanStack Query 캐시를 초기화하지 않으며, 캐시된 기록 네 건에서 한 건을 바로 필터링했다.
- 프리페치가 끝난 상태에서 URL 전환까지 지도 → 기록은 약 62ms, 기록 → 장소는 약 20ms였다. 수치는 실행 환경에 따라 달라질 수 있다.
- `pnpm exec biome check --write src app`, `pnpm exec tsc --noEmit`, `pnpm test`, Webpack 프로덕션 빌드를 통과했다.
- 기본 Turbopack 빌드는 코드 오류가 아니라 실행 환경의 프로세스·포트 권한(`EPERM`)으로 완료하지 못했다.
- mutation별 무효화와 로그아웃 캐시 초기화는 코드 경로를 확인했다. 테스트 계정 데이터를 바꾸는 생성·수정·삭제와 별도 계정을 이용한 RLS 교차 접근은 수행하지 않았다.

## 참고

- [TanStack Query Prefetching](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching)
- [TanStack Query Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js Prefetching](https://nextjs.org/docs/app/guides/prefetching)
