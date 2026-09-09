# 프로젝트 구조 및 개선 검토

- 검토일: 2026-09-09
- 범위: 프로젝트 구조, 데이터 조회·저장 흐름, 캐시, 파일 책임, re-export 및 미사용 코드
- 방법: 코드와 호출 경로 정적 검토
- 한계: 실제 네트워크 요청 횟수와 실행 시간은 측정하지 않았으며, 아래 동작 문제는 런타임 재현 전의 코드 기반 분석이다.
- 상태: 1~4번과 8~9번 구현 완료. DB 변경은 [원자적 기록·장소 저장 마이그레이션](../supabase/migrations/20260909015328_make_record_place_writes_atomic.sql) 적용 후 운영 환경에 반영된다.

현재 `app → pages → widgets → features → entities → shared` 구분은 명확하다. 개선은 폴더 재배치보다 저장 원자성과 캐시 일관성을 먼저 확보하고, 이후 중복 조회와 책임 분리, re-export 정리 순서로 진행한다.

## 우선순위

| 순서 | 항목 | 우선순위 |
| --- | --- | --- |
| 1 | ~~기록 저장 전 검증 단계의 DB 변경~~ (완료) | 높음 |
| 2 | ~~장소 저장 상태의 기록 상세 캐시 무효화 누락~~ (완료) | 높음 |
| 3 | ~~변경 가능한 데이터의 무기한 캐시~~ (완료) | 중간~높음 |
| 4 | ~~전역 사전 조회와 화면별 서버 조회의 역할 중복~~ (완료) | 중간 |
| 5 | 기록 저장 시 장소별 검색·DB 요청 반복 | 중간 |
| 6 | 푸시 발송 완료를 기다리는 기록 저장 응답 | 중간 |
| 7 | 지역 정의와 지도 계산 등 파일 책임 혼합 | 중간 |
| 8 | ~~불필요한 re-export와 공개 API~~ (완료) | 낮음 |
| 9 | ~~동일 API 호출 구현 중복 및 미사용 로직~~ (완료) | 낮음~중간 |

## ~~1. 검증 함수가 기록 저장 전에 DB를 변경한다~~ (완료)

### 완료 내용

외부 카카오 API와 기존 장소 확인 단계는 데이터를 읽기만 하도록 변경했다. 검증된 장소와 기록은 `create_owned_record_with_places`, `update_owned_record_with_places` RPC에서 한 트랜잭션으로 저장한다. 기록 저장 또는 수정이 실패하면 같은 요청에서 수행한 장소 생성·수정도 함께 롤백된다.

### 기존 문제의 근거

- [resolve-record-location.ts](../src/features/record/select-record-location/api/resolve-record-location.ts): 변경 전에는 `validateRecordSelections()`가 장소의 저장 상태를 바꾸고 장소를 생성·수정했다.
- [create-record.ts](../src/features/record/create-record/api/create-record.ts): 변경 전에는 선택 검증이 끝난 뒤 기록 저장 RPC를 따로 호출했다.
- [update-record.ts](../src/features/record/edit-record/api/update-record.ts): 변경 전에는 기록 존재 확인과 DB 변경을 포함한 선택 검증을 병렬 실행했다.

### 영향

장소 변경과 기록 저장이 별도 요청으로 실행된다. 기록 저장에 실패해도 앞서 수행한 장소 변경은 남을 수 있다. 수정할 기록이 없는 경우에도 병렬로 진행한 선택 검증에서 장소를 변경할 수 있다.

### 개선 방향

외부 API 검증을 읽기 전용 단계로 만들고, 장소 생성·수정과 기록 저장을 하나의 DB 트랜잭션으로 묶는다. 검증과 저장의 책임을 함수 이름과 구현 모두에서 분리한다.

### 개선 시 확인할 사항

기록 저장 실패, 존재하지 않는 기록 수정, 여러 장소 중 일부 처리 실패 시 장소 데이터까지 원래 상태를 유지하는지 확인한다.

## ~~2. 장소 저장 상태의 캐시 무효화가 누락된다~~ (완료)

### 완료 내용

기록 상세 전체와 장소 전용 쿼리를 `records/detail` 캐시 키 아래로 묶었다. 장소 저장 또는 삭제 시 이 상위 키를 무효화하므로, 상세 화면이 어느 조회 경로를 사용했든 최신 `saved_at` 상태를 다시 가져온다.

### 기존 문제의 근거

- [record-detail-content.tsx](../src/pages/record/detail/ui/record-detail-content.tsx): 요약 캐시 유무에 따라 상세 전체 또는 장소 정보만 조회한다.
- [queries.ts](../src/entities/record/api/queries.ts): 변경 전에는 `records/detail`과 `records/places`가 서로 다른 상위 캐시 키를 사용했다.
- [place-save-button.tsx](../src/features/place/save-place/ui/place-save-button.tsx), [delete-place-button.tsx](../src/features/place/delete-place/ui/delete-place-button.tsx): 변경 전에는 `places`와 `records/places`만 무효화하고 `records/detail`은 포함하지 않았다.

### 영향

상세 전체 데이터에도 장소의 `saved_at`이 포함되어 있다. 상세 URL 직접 진입 등으로 전체 상세 캐시를 만든 뒤 장소 저장 상태를 바꾸면, 상세 캐시에 이전 상태가 남을 수 있다.

### 개선 방향

우선 장소 상태 변경 시 영향을 받는 상세 캐시까지 갱신한다. 이후 상세 전체·요약·장소 캐시를 조합하는 현재 구조가 복잡도에 비해 충분한 이점을 주는지 검토하고 조회 경로를 단순화한다.

### 개선 시 확인할 사항

목록에서 상세 진입, 상세 URL 직접 진입, 다른 화면에서 장소 저장 해제 후 상세 복귀를 각각 확인한다.

## ~~3. 변경 가능한 데이터에 무기한 캐시를 일괄 적용한다~~ (완료)

### 완료 내용

주요 변경 가능 데이터의 `staleTime`을 1분으로 바꾸고 무기한 `gcTime`을 제거했다. 사용하지 않는 캐시는 TanStack Query 기본값에 따라 정리되며, 1분 이상 지난 데이터는 창으로 돌아왔을 때 다시 조회한다.

### 기존 문제의 근거

- [query-client.ts](../src/shared/lib/react-query/query-client.ts): 변경 전에는 `MAIN_QUERY_OPTIONS`의 `staleTime`과 `gcTime`이 모두 `Infinity`였다.
- 기록 목록·상세·지역별 기록, 저장 장소, 구성원 조회 등이 해당 설정을 사용했다.

### 영향

현재 탭의 변경은 명시적 무효화로 처리하지만 다른 기기에서 추가·수정한 기록을 자동 반영할 경로가 부족하다. 검색 조건별 기록 목록 캐시도 QueryClient가 유지되는 동안 계속 남는다.

### 개선 방향

데이터별로 유한한 만료 시간과 미사용 캐시 보관 시간을 정한다. 앱 복귀 시 재조회 정책을 마련하고, 무기한 캐시는 필요한 데이터에만 제한한다.

### 개선 시 확인할 사항

다른 기기에서 변경한 기록이 앱 복귀 후 반영되는지, 여러 검색 조건 사용 후 미사용 캐시가 정리되는지 확인한다.

## ~~4. 전역 사전 조회와 화면별 서버 조회의 역할이 겹친다~~ (완료)

### 완료 내용

네이티브 앱처럼 빠른 탭 전환을 유지하기 위해 전역 사전 조회 자체는 보존했다. 대신 `MainDataPrefetch`는 클라이언트에서 준비해야 하는 기본 기록 목록과 푸시 endpoint만 담당한다.

지도와 지역 화면이 함께 쓰는 기록 위치는 `(map)` 공통 레이아웃의 `MapDataPrefetch`가 서버에서 한 번 조회해 TanStack Query 캐시에 hydrate한다. 홈과 지역 페이지에 중복돼 있던 서버 조회와 `initialRecords` 전달은 제거했다. 저장 장소는 `/places` 서버 페이지와 하단 내비게이션의 Next.js 경로 prefetch가 담당하므로 전역 TanStack Query 사전 조회에서 제외했다.

### 기존 문제의 근거

- [main-data-prefetch.tsx](../src/app/providers/main-data-prefetch.tsx): 변경 전에는 앱 공통 레이아웃에서 기록 위치, 기본 기록 목록, 저장 장소를 모두 사전 조회했다.
- [홈 페이지](../src/pages/home/index.tsx), [지역 페이지](../src/pages/region/list/index.tsx): 변경 전에는 각각 서버에서 `getRecordLocations()`를 호출했다.
- [장소 페이지](../src/pages/place/list/ui/places-page.tsx): 검색 여부와 관계없이 저장 장소를 서버에서 조회한다.

### 영향

설정·알림 화면에 진입해도 다른 화면의 데이터 조회가 시작될 수 있다. 클라이언트 캐시가 있어도 홈·지역 페이지의 새 서버 렌더링이 발생하면 서버 조회는 별도로 수행된다.

단, 클라이언트에 전달하는 `initialData`가 있으므로 최초 진입마다 반드시 동일한 서버·클라이언트 요청이 중복된다고 단정할 수는 없다. 장소 검색 화면은 저장 여부 표시를 위해 저장 장소 데이터가 필요하므로 해당 조회 자체를 무조건 제거해서도 안 된다.

### 적용한 방향

전역 prefetch는 즉시 전환에 필요한 클라이언트 데이터로 좁히고, 서버 데이터는 가장 가까운 공통 레이아웃이나 해당 페이지가 소유한다. 하단 내비게이션의 Next.js 경로 prefetch는 유지해 화면과 서버 데이터를 미리 준비한다.

### 동작 흐름

- 지도 또는 지역 화면에 직접 진입하면 `(map)` 레이아웃이 기록 위치를 서버에서 한 번 조회하고 dehydrated cache를 내려준다. 화면의 `useQuery`는 이 데이터를 즉시 사용한다.
- 지도와 지역 탭 사이를 이동하면 두 화면이 같은 `records/locations` 캐시를 공유한다. 데이터가 1분 이내라면 다시 기다리지 않고, 오래된 데이터도 기존 화면을 먼저 보여준 뒤 백그라운드에서 갱신한다.
- 기록 탭의 기본 목록은 `MainDataPrefetch`가 계속 미리 준비한다. 저장 장소는 `/places` 경로 prefetch가 서버 페이지와 데이터를 함께 준비한다.
- 설정처럼 지도·장소 데이터가 필요 없는 화면에서는 전역 TanStack Query가 기록 위치나 저장 장소를 별도로 조회하지 않는다.

### 검증 결과

전체 테스트 33개, lint, TypeScript 검사와 webpack 프로덕션 빌드를 통과했다. 실제 기기에서의 요청 수와 탭 전환 시간 측정은 이 문서의 정적 검토 범위에 포함하지 않았다.

## 5. 기록에 포함된 장소마다 같은 검색을 반복한다

### 근거

- [resolve-record-location.ts](../src/features/record/select-record-location/api/resolve-record-location.ts): `verifyKakaoPlace()`를 장소마다 실행한다. 이후 장소별 DB 조회와 쓰기를 반복문에서 순차 실행한다.
- [save-place.ts](../src/features/place/save-place/api/save-place.ts): 별도의 장소 저장 흐름은 이미 검색어·페이지별로 그룹을 만들어 검증한다.

### 영향

동일한 검색 결과에서 여러 장소를 골라도 기록 저장 단계에서 같은 카카오 검색을 장소 수만큼 호출한다. 장소 수가 늘면 DB 왕복도 누적된다.

### 개선 방향

검색어·페이지·검색 범위별로 묶어 한 번씩 검증한다. DB의 기존 장소 조회도 일괄 처리한다. 서버에서 선택 항목을 검증하는 절차는 유지하고, 같은 요청 안의 중복 작업을 줄인다.

### 개선 시 확인할 사항

같은 검색 결과에서 여러 장소를 선택했을 때 검색 요청 수가 그룹 수에 비례하는지 확인한다. 검색 범위가 다른 항목을 잘못 합치지 않도록 한다.

## 6. 푸시 발송 완료까지 기록 저장 응답이 기다린다

### 근거

- [create-record.ts](../src/features/record/create-record/api/create-record.ts): 기록 저장 후 `await sendRecordPush()`를 실행한다.
- [send-record-push.ts](../src/features/push-notification/api/send-record-push.ts): 구독 조회, 푸시 발송, 만료 구독 삭제가 완료되어야 반환한다.

### 영향

푸시 서비스 응답이 느리면 DB에 기록이 저장된 후에도 사용자에게 저장 완료를 표시하는 시점이 늦어진다. 예외를 잡아도 대기 시간은 남는다.

### 개선 방향

푸시를 응답 이후 작업으로 이동한다. 현재 Next.js는 Server Action에서 [`after()`](https://nextjs.org/docs/app/api-reference/functions/after)를 지원한다. 배포 환경의 실행 시간 제한을 확인하고, 발송 실패 로그는 유지한다.

### 개선 시 확인할 사항

푸시 발송 지연·실패가 기록 저장 응답을 지연시키거나 저장 결과를 바꾸지 않는지 확인한다.

## 7. 줄 수보다 파일에 섞인 책임을 기준으로 분리한다

### 우선 분리 후보

[korea-map.ts](../src/entities/region/model/korea-map.ts)는 검토 시점 341줄이며 다음 책임을 포함한다.

- 행정구역 코드·이름 정의와 코드 변환
- GeoJSON 경계 처리
- 전국·지역별 격자 생성
- 기록의 격자 배치와 지역별 방문 집계

전국·지역별 격자는 모듈 최상위에서 생성한다. 단순 지역 코드 변환과 지도 계산을 같은 모듈에 두면 가벼운 기능도 무거운 초기화 코드와 결합된다. 실제 번들 포함 범위와 비용은 빌드 결과 및 실행 측정으로 확인해야 한다.

### 개선 방향

지역 정의·코드 변환과 지도 계산 모듈을 우선 분리한다. 격자 생성 시점 변경이나 사전 계산은 비용을 측정한 뒤 결정한다.

[create-record-funnel.tsx](../src/widgets/record-form/funnel/create-record-funnel.tsx)는 검토 시점 268줄로 상태·저장·단계 UI를 함께 다룬다. 다만 모델과 navigation은 이미 분리되어 있어 추가 분리 우선순위는 낮다.

자동 생성된 DB 타입이나 긴 UI 마크업은 줄 수만으로 분리하지 않는다. 변경 이유가 다른 책임이 한 파일에 모였는지를 기준으로 판단한다.

## ~~8. 불필요한 re-export와 공개 API를 줄인다~~ (완료)

### 완료 내용

기록 생성·수정 액션과 장소 삭제 버튼은 실제 사용처에서 구현 파일을 직접 가져오도록 바꾸고, 단일 export만 전달하던 `index.ts` 세 개를 삭제했다. `QueryProvider`도 루트 레이아웃에서 직접 가져오도록 바꾸고 `react-query/index.ts`를 삭제했다.

푸시 endpoint 조회는 `queries.ts`가 shared 구현을 직접 사용한다. `subscribe-push.ts`와 feature 공개 API에 있던 중간 재수출은 제거했다. 여러 기능을 실제로 공개하는 나머지 feature·entity 공개 API는 유지했다.

### 기존 근거

[프로젝트 컨벤션](./convention.md)은 외부에서 실제로 여러 파일을 가져다 쓰는 slice에만 `index.ts`를 두도록 한다.

| 대상 | 확인 내용 | 개선 방향 |
| --- | --- | --- |
| `features/record/create-record/index.ts` | 단일 액션 전달 | 구현 파일 직접 import |
| `features/record/edit-record/index.ts` | 단일 액션 전달 | 구현 파일 직접 import |
| `features/place/delete-place/index.ts` | 단일 UI 전달 | 구현 파일 직접 import |
| [push-notification/index.ts](../src/features/push-notification/index.ts) | `getPushEndpoint`를 shared → subscribe-push → index로 재수출 | shared 구현에서 직접 import하고 불필요한 재수출 제거 |
| `shared/lib/react-query/index.ts` | 외부에서는 `QueryProvider`만 사용 | 미사용 `createQueryClient` 재수출 제거 및 index 필요성 검토 |

여러 구현 파일을 실제로 공개하는 `entities/record/index.ts`까지 일괄 삭제하지 않는다. 서버·클라이언트 경계를 구분하는 공개 API도 단순 전달 파일과 구별한다.

## ~~9. 동일 API 호출 중복과 미사용 로직을 정리한다~~ (완료)

### 완료 내용

장소 검색의 다음 페이지 조회는 페이지 컴포넌트 안의 직접 `fetch`와 중복 응답 타입을 삭제하고, 기존 `searchPlaces()`를 사용하도록 통일했다. 이에 따라 동일한 Axios timeout과 AbortSignal 취소 처리를 사용한다.

운영 코드에서 호출되지 않던 단일 장소용 `createPlace()`와 클라이언트 기록 필터용 `filterRecords()`를 제거했다. `filterRecords()`만 확인하던 테스트 데이터와 assertion도 함께 삭제하고, 실제로 사용하는 필터 파싱·URL 생성 테스트는 유지했다.

### 기존 동일 API 호출 중복

- [place-search-results.tsx](../src/pages/place/list/ui/place-search-results.tsx): 페이지 안에서 직접 `fetch`와 응답 타입을 정의한다.
- [search-places.ts](../src/entities/place/api/search-places.ts): 같은 엔드포인트의 호출 함수가 이미 있으며 취소 signal을 전달한다.

페이지와 entity의 호출 경로가 나뉘어 취소·타임아웃·오류 처리 방식이 다르다. 페이지의 infinite query는 유지하되 요청 함수와 응답 타입은 기존 API 구현을 재사용한다.

### 기존 미사용 로직

- [save-place.ts](../src/features/place/save-place/api/save-place.ts)의 `createPlace()`: 검토한 소스에서 호출처가 없다.
- [record-filters.ts](../src/entities/record/model/record-filters.ts)의 `filterRecords()`: 테스트에서만 사용한다. 실제 목록 필터는 서버 쿼리로 구현되어 있다.

실제 사용 흐름을 최종 확인한 뒤 미사용 함수와 그 함수만 검증하는 테스트를 함께 정리한다. 테스트가 존재한다는 이유만으로 운영 코드에서 사용하지 않는 구현을 유지하지 않는다.

### 검증 결과

전체 테스트 33개, lint, TypeScript 검사와 webpack 프로덕션 빌드를 통과했다.

## 후속 작업 원칙

- 저장 원자성과 캐시 일관성을 먼저 수정한다.
- 요청 최적화는 수정 전후 요청 수와 응답 시간을 비교한다.
- 파일 분리는 책임이 나뉘는 지점에서 수행하며, 새 추상화나 공용 레이어를 먼저 만들지 않는다.
- 각 항목의 구현 전 현재 호출처를 다시 확인한다. 이 문서의 파일 경로와 줄 수는 검토 시점 기준이다.
- 코드 변경 후 검증은 [검증 가이드](./verification.md)를 따른다.
