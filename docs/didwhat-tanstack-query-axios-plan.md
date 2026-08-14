# didWhat — TanStack Query + Axios 도입 플랜

## 1. 목표

didWhat 프로젝트에 `TanStack Query`와 `Axios`를 도입한다.

이번 작업의 핵심 목표는 다음과 같다.

- 서버 상태 관리를 `TanStack Query`로 일원화
- 일반 REST API 및 외부 API 요청을 `Axios` 기반으로 구성
- Supabase 요청은 `@supabase/supabase-js`를 그대로 사용
- FSD 아키텍처의 레이어 및 Public API 규칙 유지
- 향후 `records`, `persons`, `places`, Kakao 장소 검색 API 확장을 고려한 구조 설계
- Query Key를 중앙화하여 캐시 무효화 및 유지보수성을 높임

---

## 2. 기술 원칙

### TanStack Query

TanStack Query는 다음 역할만 담당한다.

- 서버 상태 캐싱
- loading / error / success 상태 관리
- staleTime 및 refetch 정책
- mutation
- query invalidation
- 요청 취소
- 서버 데이터 동기화

로컬 UI 상태를 TanStack Query에 저장하지 않는다.

예:

- 모달 open 여부
- 현재 선택된 탭
- input 임시 값
- 클라이언트 전용 filter 상태

위 상태들은 React state 또는 적절한 클라이언트 상태 관리 방식을 사용한다.

---

### Axios

Axios는 다음 요청에 사용한다.

- Next.js Route Handler API
- Kakao REST API
- 기타 외부 REST API

Axios 공통 인스턴스를 `shared/api`에 구성한다.

Axios 인스턴스에서 다음 설정을 관리한다.

- `baseURL`
- `timeout`
- 공통 headers
- interceptor가 필요한 경우 공통 처리
- AbortSignal 지원

---

### Supabase

Supabase 요청에 Axios를 사용하지 않는다.

다음 SDK를 그대로 사용한다.

```ts
@supabase/supabase-js
```

Supabase query 함수 자체를 TanStack Query의 `queryFn` 또는 `mutationFn`으로 사용한다.

구조:

```text
TanStack Query
├── Supabase SDK
│   └── Supabase DB / Auth / Storage
│
└── Axios
    ├── Next.js API
    ├── Kakao REST API
    └── 기타 REST API
```

---

# 3. 패키지 설치

프로젝트 패키지 매니저는 `pnpm`을 사용한다.

```bash
pnpm add @tanstack/react-query axios
```

개발 중 React Query Devtools가 필요하다면 추가한다.

```bash
pnpm add -D @tanstack/react-query-devtools
```

Devtools는 production 환경에서는 노출되지 않도록 구성한다.

---

# 4. 권장 FSD 구조

기존 didWhat의 FSD 구조를 유지한다.

```text
src/
├── app/
│
├── _pages/
│
├── features/
│
├── entities/
│   ├── record/
│   │   ├── api/
│   │   │   ├── get-records.ts
│   │   │   ├── get-record.ts
│   │   │   ├── create-record.ts
│   │   │   └── queries.ts
│   │   │
│   │   ├── model/
│   │   │   └── types.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── person/
│   │   ├── api/
│   │   ├── model/
│   │   └── index.ts
│   │
│   └── place/
│       ├── api/
│       ├── model/
│       └── index.ts
│
└── shared/
    ├── api/
    │   ├── axios-instance.ts
    │   └── index.ts
    │
    └── lib/
        └── react-query/
            ├── query-client.ts
            ├── query-provider.tsx
            └── index.ts
```

필요 이상으로 파일을 세분화하지 않는다.

현재 프로젝트 규모에서 불필요한 추상화는 피한다.

---

# 5. QueryClient 구성

다음 위치에 QueryClient 설정을 만든다.

```text
src/shared/lib/react-query/query-client.ts
```

기본 방향:

```ts
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
```

주의:

- 모든 API에 동일한 `staleTime`이 적절하다고 가정하지 않는다.
- 개별 query에서 필요하면 override한다.
- 지나치게 긴 global staleTime을 설정하지 않는다.
- mutation에는 자동 retry를 무분별하게 적용하지 않는다.

---

# 6. Query Provider 구성

다음 파일을 만든다.

```text
src/shared/lib/react-query/query-provider.tsx
```

Client Component로 작성한다.

예시:

```tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";

import { createQueryClient } from "./query-client";

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

QueryClient를 컴포넌트 렌더링마다 새로 생성하지 않는다.

---

# 7. Next.js App Router에 Provider 연결

현재 root layout 구조를 확인한 뒤 적절한 Provider 계층에 `QueryProvider`를 연결한다.

예:

```tsx
<QueryProvider>
  {children}
</QueryProvider>
```

가능하면 `app/layout.tsx` 전체를 `"use client"`로 변경하지 않는다.

필요한 Provider만 Client Component로 분리한다.

예:

```text
src/app/providers.tsx
```

또는 현재 프로젝트에서 이미 사용하는 provider 구조가 있다면 해당 구조에 통합한다.

---

# 8. Axios 공통 인스턴스

다음 파일을 만든다.

```text
src/shared/api/axios-instance.ts
```

예:

```ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10_000,
});
```

Public API:

```ts
// src/shared/api/index.ts

export { apiClient } from "./axios-instance";
```

---

# 9. Axios interceptor 정책

초기 구현에서는 interceptor를 최소화한다.

명확한 요구사항이 없는 경우 다음 작업을 interceptor에 넣지 않는다.

- 모든 오류 toast 자동 표시
- 모든 response 강제 변환
- business error 자동 처리
- 페이지 이동
- 임의의 auth redirect

Interceptor는 향후 실제 공통 요구사항이 생길 때 추가한다.

필요한 경우 다음 정도만 고려한다.

- 인증 header
- 공통 HTTP 오류 normalization
- request logging (development only)

---

# 10. AbortSignal 적용

TanStack Query가 query를 취소할 때 Axios 요청도 취소될 수 있도록 `signal`을 연결한다.

예:

```ts
export async function getRecords(signal?: AbortSignal) {
  const { data } = await apiClient.get("/records", {
    signal,
  });

  return data;
}
```

Query:

```ts
queryFn: ({ signal }) => getRecords(signal)
```

가능한 모든 조회 API에 이 패턴을 적용한다.

---

# 11. Entity API 함수 구성

API 호출 자체와 TanStack Query 설정을 분리한다.

예:

```text
entities/record/api/
├── get-records.ts
├── create-record.ts
└── queries.ts
```

`get-records.ts`:

```ts
import { apiClient } from "@/shared/api";

import type { Record } from "../model/types";

export async function getRecords(signal?: AbortSignal) {
  const { data } = await apiClient.get<Record[]>("/records", {
    signal,
  });

  return data;
}
```

API 함수 내부에서 `useQuery`, `useMutation` 등의 React Hook을 호출하지 않는다.

---

# 12. Query Key Factory

Query key를 컴포넌트 내부에서 직접 반복 작성하지 않는다.

잘못된 예:

```ts
useQuery({
  queryKey: ["records"],
});
```

여러 곳에서 위 형태를 반복하지 않는다.

Entity 단위 query key factory를 만든다.

```ts
export const recordKeys = {
  all: ["records"] as const,

  lists: () => [...recordKeys.all, "list"] as const,

  list: (filters?: RecordFilters) =>
    [...recordKeys.lists(), filters] as const,

  details: () =>
    [...recordKeys.all, "detail"] as const,

  detail: (recordId: string) =>
    [...recordKeys.details(), recordId] as const,
};
```

---

# 13. queryOptions 사용

가능하면 TanStack Query의 `queryOptions`를 활용해 query 설정을 재사용한다.

예:

```ts
import { queryOptions } from "@tanstack/react-query";

import { getRecords } from "./get-records";

export const recordQueries = {
  all: () => ["records"] as const,

  list: () =>
    queryOptions({
      queryKey: [...recordQueries.all(), "list"],
      queryFn: ({ signal }) => getRecords(signal),
    }),
};
```

사용:

```ts
const { data } = useQuery(recordQueries.list());
```

---

# 14. Mutation 구성

Record 생성 예시:

```ts
export async function createRecord(payload: CreateRecordPayload) {
  const { data } = await apiClient.post<Record>("/records", payload);

  return data;
}
```

Mutation:

```ts
const queryClient = useQueryClient();

const createRecordMutation = useMutation({
  mutationFn: createRecord,

  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: recordQueries.all(),
    });
  },
});
```

초기 단계에서는 optimistic update를 적용하지 않는다.

실제 UX 요구가 발생했을 때 도입한다.

---

# 15. Supabase + TanStack Query

Supabase용 API 함수는 Axios를 거치지 않는다.

예:

```ts
export async function getRecords() {
  const { data, error } = await supabase
    .from("records")
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}
```

TanStack Query에서는 그대로 사용한다.

```ts
queryOptions({
  queryKey: ["records"],
  queryFn: getRecords,
});
```

단, 실제 구현에서는 앞에서 정의한 query key factory를 사용한다.

---

# 16. Kakao 장소 검색

Kakao 장소 검색 API는 클라이언트에서 REST API Key를 직접 노출하지 않는다.

권장 흐름:

```text
Client
  ↓
TanStack Query
  ↓
/api/places/search
  ↓
Axios
  ↓
Kakao REST API
```

예:

```text
src/app/api/places/search/route.ts
```

또는 프로젝트에서 사용하는 서버 API 레이어 구조에 맞게 배치한다.

Kakao REST API Key는 서버 환경변수에서만 접근한다.

예:

```env
KAKAO_REST_API_KEY=
```

`NEXT_PUBLIC_` prefix를 붙이지 않는다.

---

# 17. 장소 검색 Query

검색어가 변경될 때마다 즉시 API를 호출하지 않는다.

debounce를 적용한다.

권장:

```text
300 ~ 500ms
```

그리고 검색어 길이가 너무 짧으면 query를 비활성화한다.

예:

```ts
queryOptions({
  queryKey: placeQueries.search(keyword),
  queryFn: ({ signal }) => searchPlaces(keyword, signal),
  enabled: keyword.trim().length >= 2,
});
```

검색 결과는 비교적 짧은 staleTime을 적용한다.

---

# 18. Record 생성 페이지 적용

`/records/new`의 저장 기능은 이미 구현되어 있다. Server Action `createRecord`가 담당하며 TanStack Query를 거치지 않는다.

필수 필드:

```text
recordedAt
personIds
regionCode
activity
```

`places`(방문 장소)는 선택 사항이고 최대 10곳까지 담을 수 있다.

현재 저장 흐름:

```text
사용자 입력
   ↓
validateRecordInput (필드별 오류 반환)
   ↓
createRecord Server Action
   ↓
성공
   ↓
revalidatePath("/", "/records", "/places")
   ↓
redirect("/records")
```

`records`, `people`, `places` 조회는 모두 Server Component가 Supabase 서버 클라이언트로 직접 수행하므로,
갱신은 클라이언트 캐시 무효화가 아니라 `revalidatePath`로 처리한다.
클라이언트 query cache에 record 목록이 들어가면 그때 `invalidateQueries`를 함께 도입한다.

mutation 상태는 `useActionState`가 돌려주는 값을 쓴다.

```ts
const [state, formAction, pending] = useActionState(createRecord, INITIAL_STATE);
```

```text
pending          → 저장 버튼 loading, 중복 제출 방지
state.fieldErrors → 각 입력란 아래 Field Error
state.message     → 저장 자체가 실패했을 때 error Toast
```

`useMutation`을 쓰지 않는 이유는 이 액션이 성공 시 `redirect()`로 끝나기 때문이다.
`redirect()`는 `NEXT_REDIRECT`를 throw하므로 `useMutation`으로 감싸면 성공이 `onError`로 떨어진다.

---

# 19. Error 처리 원칙

HTTP 오류를 컴포넌트마다 Axios 구조에 의존하여 처리하지 않는다.

피해야 할 코드:

```ts
error.response?.data?.message
```

UI가 AxiosError 내부 구조를 직접 알지 않도록 한다.

필요한 시점에 공통 Error type 또는 normalize 함수 도입을 검토한다.

단, 현재 요구사항이 없다면 과도하게 추상화하지 않는다.

---

# 20. Loading UX

페이지 전체 loading과 부분 loading을 구분한다.

예:

```text
페이지 최초 데이터
→ skeleton

mutation
→ CTA loading

검색
→ 검색 결과 영역 loading
```

모든 API 호출 시 화면 전체 spinner를 띄우지 않는다.

---


# 21. Toast 및 Server-State Side Effect 정책

현재 일부 API 상태에서 `useEffect`로 `isSuccess`, `isError` 등의 상태를 감시하여
shadcn/ui 기반 Toast를 호출하고 있다면 이번 TanStack Query 도입 작업에서 함께 정리한다.

목표는 다음과 같다.

- API mutation 결과에 대한 Toast 처리를 `useEffect`에서 제거
- mutation side effect를 TanStack Query lifecycle callback으로 이동
- Toast / Error UI / Field Error의 책임을 명확히 분리
- Axios 및 Supabase 오류를 UI가 직접 해석하지 않도록 구성
- retry / refetch로 인한 중복 Toast 가능성을 방지

---

## 21.1 제거해야 하는 패턴

다음처럼 mutation 상태를 `useEffect`에서 감시하여 Toast를 호출하는 패턴은 제거한다.

```tsx
const mutation = useMutation(...);

useEffect(() => {
  if (mutation.isSuccess) {
    toast.success("저장되었습니다.");
  }
}, [mutation.isSuccess]);

useEffect(() => {
  if (mutation.isError) {
    toast.error("저장에 실패했습니다.");
  }
}, [mutation.isError]);
```

이 방식은 다음 문제가 있다.

- mutation lifecycle과 side effect가 분리됨
- effect dependency 관리가 필요함
- mutation reset 시점과 Toast 실행 시점이 불명확해질 수 있음
- 동일 상태를 여러 컴포넌트가 감시할 경우 중복 처리가 발생할 수 있음
- TanStack Query가 제공하는 mutation callback과 역할이 중복됨

API mutation 결과 처리만을 목적으로 하는 `useEffect`는 만들지 않는다.

---

## 21.2 Mutation Side Effect 처리

mutation 결과에 따른 side effect는 기본적으로 다음 callback을 사용한다.

```text
onSuccess
→ 성공 후 처리
→ success toast
→ query invalidation
→ 필요 시 navigation

onError
→ 실패 후 처리
→ error toast
→ 필요 시 error logging

onSettled
→ 성공/실패와 관계없이 필요한 공통 후처리
```

예:

```tsx
const queryClient = useQueryClient();

const createRecordMutation = useMutation({
  mutationFn: createRecord,

  onSuccess: async () => {
    toast.success("기록을 저장했어요.");

    await queryClient.invalidateQueries({
      queryKey: recordQueries.all(),
    });
  },

  onError: (error) => {
    toast.error(getErrorMessage(error));
  },
});
```

---

## 21.3 Mutation 상태와 UI 상태 구분

mutation 상태는 UI 렌더링에 직접 사용한다.

예:

```tsx
<Button
  type="submit"
  disabled={createRecordMutation.isPending}
>
  {createRecordMutation.isPending ? "저장 중..." : "기록 저장"}
</Button>
```

권장 역할:

```text
isPending
→ 버튼 disabled
→ loading indicator
→ 중복 submit 방지

isError
→ 필요한 경우 inline error state 렌더링

isSuccess
→ UI가 지속적으로 성공 상태를 표현해야 할 때만 사용

onSuccess
→ 일회성 성공 side effect

onError
→ 일회성 실패 side effect
```

Toast 발생만을 위해 `isSuccess`, `isError`를 effect에서 관찰하지 않는다.

---

# 22. Toast 사용 기준

Toast는 모든 에러를 표현하는 범용 상태 UI로 사용하지 않는다.

didWhat에서는 다음 원칙을 따른다.

```text
Toast
= 사용자 액션에 대한 일시적인 결과 피드백

Error UI
= 페이지 또는 서버 데이터 상태 자체의 오류

Field Error
= 사용자가 수정할 수 있는 입력 오류
```

예:

| 상황 | 권장 처리 |
|---|---|
| 기록 생성 성공 | success Toast |
| 기록 생성 실패 | error Toast |
| 기록 수정 성공 | success Toast |
| 기록 삭제 성공 | success Toast |
| 기록 삭제 실패 | error Toast |
| 사용자가 실행한 장소 검색 실패 | 상황에 따라 inline Error UI 또는 Toast |
| 페이지 최초 데이터 조회 실패 | Error UI |
| 목록 데이터 조회 실패 | Error UI |
| background refetch 실패 | 기본적으로 Toast 표시 안 함 |
| Form validation 실패 | Field Error |
| 필수값 누락 | Field Error |
| API 요청 중 | 버튼/영역 loading 상태 |

Toast를 페이지의 영구적인 오류 표현 수단으로 사용하지 않는다.

---

# 23. Query 조회 실패 처리

`useQuery` 조회 실패를 mutation과 동일하게 처리하지 않는다.

특히 조회 query는 다음 상황에서 재실행될 수 있다.

- retry
- refetch
- invalidate
- reconnect
- mount
- background refetch

따라서 조회 query 실패마다 Toast를 자동 호출하면 중복 Toast가 발생할 수 있다.

페이지 또는 목록의 핵심 데이터 조회 실패는 기본적으로 Error UI로 표현한다.

예:

```tsx
const recordsQuery = useQuery(recordQueries.list());

if (recordsQuery.isPending) {
  return <RecordListSkeleton />;
}

if (recordsQuery.isError) {
  return <RecordListError />;
}

return <RecordList records={recordsQuery.data} />;
```

background refetch 실패는 기존 데이터가 화면에 남아 있다면
사용자 경험을 방해하는 Toast를 기본적으로 노출하지 않는다.

실제 서비스 요구사항이 생기면 개별 query 단위로 판단한다.

---

# 24. Form Validation Error

폼 validation 오류는 Toast보다 해당 Field 근처에 표시한다.

예:

```text
recordedAt 누락
→ 날짜 Field Error

personIds가 0명
→ 함께한 사람 Field Error

placeId 누락
→ 장소 Field Error

activity 누락
→ 활동 내용 Field Error
```

서버 validation 오류도 특정 field에 명확히 매핑할 수 있다면
Toast보다 Field Error를 우선한다.

Toast는 사용자가 직접 수정하기 어려운 요청 실패나
전체 작업 결과 피드백에 사용한다.

---

# 25. Error Message 정규화

UI 컴포넌트가 Axios 또는 Supabase 내부 오류 구조를 직접 해석하지 않도록 한다.

피해야 할 코드:

```ts
error.response?.data?.message
```

또는 UI 곳곳에서:

```ts
if (axios.isAxiosError(error)) {
  ...
}
```

같은 처리를 반복하지 않는다.

공통적으로 사용할 필요가 생기면 `shared`에 error normalization 함수를 둔다.

예시 위치:

```text
src/shared/api/
├── axios-instance.ts
├── get-error-message.ts
└── index.ts
```

예:

```ts
import axios from "axios";

const DEFAULT_ERROR_MESSAGE = "요청을 처리하지 못했어요.";

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    return DEFAULT_ERROR_MESSAGE;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return DEFAULT_ERROR_MESSAGE;
}
```

단, 실제 backend error response schema가 존재한다면
해당 schema를 먼저 확인한 후 그 구조에 맞게 구현한다.

임의로 `{ message: string }` 형식을 backend 표준이라고 가정하지 않는다.

---

# 26. Supabase Error 처리

Supabase API 함수 내부에서는 SDK가 반환한 error를 무시하지 않는다.

예:

```ts
export async function getRecords() {
  const { data, error } = await supabase
    .from("records")
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}
```

TanStack Query가 오류를 받을 수 있도록 반드시 throw한다.

Mutation도 동일하다.

```ts
export async function createRecord(payload: CreateRecordPayload) {
  const { data, error } = await supabase
    .from("records")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
```

Supabase error message를 사용자에게 그대로 노출하는 것이 적절한지는 별도로 판단한다.

내부 DB 정보나 개발자용 메시지가 포함될 가능성이 있다면
사용자 친화적인 메시지로 변환한다.

---

# 27. Global Toast 처리 금지

초기 구현에서는 QueryClient 또는 Axios interceptor에
전역 success/error Toast 로직을 추가하지 않는다.

다음과 같은 구조는 피한다.

```text
모든 HTTP 4xx/5xx
→ interceptor
→ 자동 error Toast
```

또는:

```text
모든 mutation 성공
→ Global MutationCache
→ 자동 success Toast
```

이유:

- background query 오류까지 Toast가 발생할 수 있음
- UI 문맥과 맞지 않는 메시지가 표시될 수 있음
- Field Error로 보여야 할 오류까지 Toast로 노출될 수 있음
- 중복 Toast가 발생하기 쉬움
- 특정 mutation의 UX 제어가 어려워짐

Toast는 기본적으로 해당 사용자 액션을 소유한 feature/page에서 명시적으로 처리한다.

공통화 요구가 실제로 반복될 때만 추상화를 검토한다.

---

# 28. 기존 useEffect 정리 기준

TanStack Query 도입 과정에서 기존 `useEffect`를 확인한다.

다음 목적으로 사용 중인 effect는 제거 또는 리팩터링 후보이다.

```text
API 성공 감시 → Toast
API 실패 감시 → Toast
API 상태 변경 감시 → query invalidate
API 완료 감시 → navigation
서버 데이터 fetch
```

예:

```tsx
useEffect(() => {
  if (isSuccess) {
    toast.success(...);
    router.push(...);
  }
}, [isSuccess]);
```

가능하면:

```tsx
useMutation({
  mutationFn,

  onSuccess: () => {
    toast.success(...);
    router.push(...);
  },
});
```

로 이동한다.

단, 모든 `useEffect`를 제거하는 작업으로 확대하지 않는다.

DOM synchronization, subscription, browser API synchronization 등
React effect가 실제로 필요한 코드에는 그대로 사용한다.


# 29. React Query Devtools

개발 환경에서만 Devtools를 노출한다.

예:

```tsx
{process.env.NODE_ENV === "development" && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

필수 기능은 아니므로 기존 프로젝트 구조가 복잡해진다면 생략 가능하다.

---

# 30. FSD 의존성 규칙

현재 프로젝트의 의존 방향을 유지한다.

```text
app
 ↓
_pages
 ↓
features
 ↓
entities
 ↓
shared
```

하위 레이어가 상위 레이어를 import하지 않는다.

예:

```text
entities → _pages
```

금지.

---

# 31. Public API 규칙

각 slice 외부에서는 가능한 `index.ts` Public API를 통해 import한다.

예:

```ts
import { recordQueries } from "@/entities/record";
```

피해야 할 형태:

```ts
import { recordQueries } from "@/entities/record/api/queries";
```

단, 프로젝트의 기존 import 규칙과 충돌한다면 기존 규칙을 우선한다.

---

# 32. 구현 순서

다음 순서로 작업한다.

## Phase 1. 현재 구조 확인

먼저 다음을 확인한다.

- 현재 `package.json`
- 현재 Provider 구조
- Supabase client 위치
- `src/app/layout.tsx`
- `src/shared`
- `src/entities`
- `src/features`
- 현재 barrel export 규칙
- alias 설정

기존 코드를 확인하지 않고 새 구조를 임의로 생성하지 않는다.

---

## Phase 2. 패키지 설치

```bash
pnpm add @tanstack/react-query axios
```

필요할 경우:

```bash
pnpm add -D @tanstack/react-query-devtools
```

---

## Phase 3. TanStack Query 기반 구성

구현:

```text
shared/lib/react-query/
├── query-client.ts
├── query-provider.tsx
└── index.ts
```

App Router Provider 연결까지 완료한다.

---

## Phase 4. Axios 기반 구성

구현:

```text
shared/api/
├── axios-instance.ts
└── index.ts
```

초기 설정은 최소화한다.

---

## Phase 5. Record API 구조 적용

`record` entity가 현재 존재한다면 기존 구조를 최대한 유지하면서 다음을 추가한다.

```text
entities/record/api/
```

구현 대상:

- query key
- queryOptions
- 조회 함수
- 생성 mutation 함수 구조

실제 backend API가 아직 없다면 fake API를 만들지 않는다.

타입 및 API 인터페이스 구조까지만 준비한다.

---

## Phase 6. Place / Kakao 검색 구조 준비

현재 Kakao API 구현 상태를 확인한다.

이미 구현되어 있다면 기존 코드를 새 API 레이어에 맞게 리팩터링한다.

아직 구현되지 않았다면 다음 구조만 준비한다.

```text
/api/places/search
entities/place/api/
```

API Key를 클라이언트에 노출하지 않는다.

---

## Phase 7. 기존 코드 적용

기존에 서버 데이터를 직접 `useEffect` 등으로 불러오는 코드가 있다면 확인한다.

다음 패턴:

```ts
useEffect(() => {
  fetch(...);
}, []);
```

서버 상태 조회라면 TanStack Query로 전환을 검토한다.

단순히 `useEffect`가 존재한다고 무조건 제거하지 않는다.

---

## Phase 8. Toast / Error / useEffect 정리

현재 API 상태와 관련된 Toast 구현을 검색한다.

다음 패턴을 우선 확인한다.

```text
useEffect + isSuccess
useEffect + isError
useEffect + mutation status
axios error 직접 접근
Supabase error 직접 UI 출력
```

정리 원칙:

- mutation 결과 Toast → `onSuccess` / `onError`
- mutation 후 query 갱신 → `onSuccess`의 `invalidateQueries`
- mutation 후 navigation → 필요한 경우 `onSuccess`
- 페이지 조회 실패 → Error UI
- validation 오류 → Field Error
- background refetch 오류 → 기본적으로 Toast 없음
- UI의 Axios/Supabase 오류 구조 직접 접근 → 필요한 경우 공통 error normalizer 사용

기존 Toast 컴포넌트 또는 shadcn/ui Toast 사용 방식 자체는
불필요하게 교체하지 않는다.

이번 작업의 목적은 Toast 라이브러리 변경이 아니라
server-state lifecycle과 side effect의 책임 정리이다.

---

## Phase 9. 검증

다음을 실행한다.

```bash
pnpm lint
```

프로젝트에 typecheck 명령이 있다면 실행한다.

예:

```bash
pnpm typecheck
```

테스트가 있다면 실행한다.

```bash
pnpm test
```

프로젝트 실제 script 이름은 `package.json` 기준으로 사용한다.

---

# 33. 완료 조건

아래 조건을 모두 만족하면 작업 완료로 판단한다.

- [ ] `@tanstack/react-query` 설치
- [ ] `axios` 설치
- [ ] QueryClient 구성 완료
- [ ] QueryClientProvider 연결 완료
- [ ] root layout 전체를 불필요하게 Client Component로 변경하지 않음
- [ ] Axios 공통 instance 구성
- [ ] TanStack Query의 AbortSignal과 Axios 연결 가능 구조 구성
- [ ] Supabase 호출을 Axios로 감싸지 않음
- [ ] Query key가 entity API 계층에서 관리됨
- [ ] queryOptions 기반 재사용 구조 구성
- [ ] mutation 후 적절한 query invalidation 가능
- [ ] Kakao REST API Key가 Client Bundle에 노출되지 않음
- [ ] FSD 의존 방향 준수
- [ ] Public API 규칙 준수
- [ ] lint 통과
- [ ] typecheck가 존재한다면 통과
- [ ] 기존 테스트가 있다면 통과
- [ ] 기존 UI 및 기능 regression 없음
- [ ] mutation success/error Toast를 위한 `useEffect` 제거
- [ ] mutation side effect를 `onSuccess` / `onError` / `onSettled` 중 적절한 callback으로 이동
- [ ] mutation pending 상태를 UI loading / disabled 처리에 사용
- [ ] 페이지 또는 핵심 데이터 조회 실패는 Error UI로 처리
- [ ] Form validation 오류는 Field Error로 처리
- [ ] background refetch 실패 시 불필요한 Toast가 발생하지 않음
- [ ] UI 컴포넌트에서 Axios error 구조에 직접 의존하는 코드 제거 또는 최소화
- [ ] Supabase 함수가 error 발생 시 throw하도록 구성
- [ ] 사용자에게 내부 Supabase/DB 오류 메시지가 그대로 노출되지 않도록 검토
- [ ] Axios interceptor에 전역 Toast 로직을 추가하지 않음
- [ ] QueryClient 전역 callback에 무분별한 Toast 로직을 추가하지 않음

---

# 34. 하지 말아야 할 것

다음 작업은 명확한 필요가 없다면 수행하지 않는다.

- Zustand 등 별도 상태 관리 라이브러리 추가
- Axios 외 다른 HTTP Client 추가
- Supabase 호출을 Axios로 감싸기
- 모든 API를 Next.js Route Handler로 강제 프록시
- 모든 query에 동일한 staleTime 강제
- 과도한 Generic Repository Pattern
- 불필요한 Service class 생성
- API별 custom hook을 무조건 생성
- interceptor에서 UI toast 직접 호출
- 모든 mutation에 optimistic update 적용
- queryKey 문자열을 컴포넌트마다 직접 작성
- 기존 FSD 구조 전면 변경
- 작업 범위와 무관한 UI 리팩터링
- mutation 결과 Toast만을 위한 `useEffect`
- 모든 query 실패에 자동 error Toast 표시
- background refetch 실패에 무조건 Toast 표시
- Axios interceptor에서 전역 Toast 호출
- QueryClient / MutationCache에 무분별한 전역 Toast 처리
- Field validation 오류를 모두 Toast로 표시
- Supabase raw error를 사용자에게 그대로 노출

---

# 35. 에이전트 실행 지침

이 문서를 읽는 구현 에이전트는 다음 규칙을 따른다.

1. 먼저 프로젝트 전체 구조와 기존 코드를 확인한다.
2. 기존 아키텍처 및 naming convention을 우선한다.
3. 이 문서는 방향을 정의하며, 실제 코드와 충돌하면 기존 코드 구조를 분석한 뒤 가장 적은 변경으로 적용한다.
4. 작업 범위를 임의로 확장하지 않는다.
5. 기존 기능을 깨뜨리지 않는다.
6. 불필요한 abstraction을 추가하지 않는다.
7. 변경 후 lint / typecheck / test를 가능한 범위에서 실행한다.
8. 오류가 발생하면 원인을 해결한 후 완료 처리한다.
9. 실행되지 않은 검증 명령이 있다면 완료 보고에서 명확히 밝힌다.
10. 최종 보고에는 다음 내용을 포함한다.

```text
1. 변경 파일
2. 설치된 패키지
3. Query 구조
4. Axios 구조
5. Supabase 처리 방식
6. Kakao API 처리 방식
7. Toast / Error / Side Effect 정리 내용
8. 제거 또는 변경한 useEffect
9. 검증 결과
10. 남은 작업
```

---

# 최종 목표 구조

```text
                         didWhat Client
                              │
                       TanStack Query
                              │
               ┌──────────────┴──────────────┐
               │                             │
          Supabase SDK                    Axios
               │                             │
         Supabase APIs              ┌────────┴────────┐
                                    │                 │
                              Next.js API       External REST
                                    │                 │
                                    │              Kakao API
                                    │
                              Application API
```

TanStack Query를 didWhat의 **server-state orchestration layer**로 사용하고,
Axios는 **REST transport layer**로 제한한다.

Supabase는 공식 SDK를 유지한다.
