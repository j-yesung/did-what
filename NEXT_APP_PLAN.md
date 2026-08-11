# 다음 단계: Kakao 장소 검색과 저장 연결

## 목적

`/places` placeholder를 Kakao Local REST API와 Supabase에 연결해 사용자가 실제 장소를 검색하고 기록에 사용할 수 있게 한다.

이번 단계는 장소 검색, 저장, 저장된 장소 목록까지만 구현한다. 지도 표시와 장소 수정·삭제는 실제 기록과의 연결 흐름이 완성된 뒤 다룬다.

## Provider 결정

Kakao Local REST API의 `키워드로 장소 검색`을 사용한다.

- 검색 결과가 장소 고유 ID, 장소명, 지번·도로명 주소, WGS84 경도·위도를 함께 제공해 현재 `places` 스키마에 바로 저장할 수 있다.
- REST API 키 하나로 서버에서 호출할 수 있다.
- 공식 문서 기준 키워드 장소 검색의 무료 일간 쿼터는 100,000건이다.
- Naver 지역 검색도 후보지만 별도 client ID/secret이 필요하고, 이번 흐름에는 Kakao 응답의 장소 ID와 좌표 형식이 더 직접적이다.

참고:

- [Kakao 키워드 장소 검색](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword)
- [Kakao API 쿼터](https://developers.kakao.com/docs/latest/ko/getting-started/quota)

## 사전 준비

- Kakao Developers에서 앱과 REST API 키를 발급한다.
- 로컬과 배포 환경에 `KAKAO_REST_API_KEY`를 설정한다.
- 키 이름에 `NEXT_PUBLIC_`을 붙이지 않고 서버 코드에서만 읽는다.
- 실제 키는 Git에 커밋하지 않는다.

키가 설정되지 않은 환경에서도 빌드는 성공해야 하며, 장소 검색 시에만 설정 안내 오류를 표시한다.

## 완료 조건

- `/places`에서 현재 사용자가 저장한 장소를 확인할 수 있다.
- 검색어를 제출하면 Kakao 장소 결과를 확인할 수 있다.
- 검색 결과 하나를 선택해 내 장소로 저장할 수 있다.
- 같은 Kakao 장소는 사용자별로 한 번만 저장된다.
- 저장한 장소는 `/records/new` 선택지에 바로 나타난다.
- 다른 사용자의 장소는 조회하거나 저장 결과에 섞이지 않는다.
- 검색, provider, 저장 오류를 한국어로 표시한다.
- 빈 목록과 검색 결과 없음 상태를 구분해 안내한다.

## 검색 흐름

`/places?q=검색어`의 GET 폼을 사용한다. 입력할 때마다 요청하는 client debounce나 검색 상태 store는 만들지 않는다.

1. Server Component에서 `q`의 앞뒤 공백을 제거하고 1자 이상 100자 이하인지 확인한다.
2. 검색어가 있을 때만 서버에서 `GET /v2/local/search/keyword.json`을 호출한다.
3. `Authorization: KakaoAK ${KAKAO_REST_API_KEY}` 헤더를 사용한다.
4. 첫 페이지 최대 15건만 요청하고 기본 정확도순을 유지한다.
5. 응답에서 아래 필드만 화면 모델로 변환한다.

```text
id
place_name
road_address_name
address_name
x → longitude
y → latitude
```

- 주소는 `road_address_name || address_name` 순으로 표시한다.
- 네트워크 실패, provider 오류 응답, 잘못된 응답 형식을 한 가지 사용자용 오류로 처리한다.
- provider 오류 원문과 REST API 키는 브라우저에 노출하지 않는다.
- 검색 요청은 캐시하지 않는다.

## 장소 저장

Server Action에는 검색어와 Kakao 장소 ID만 전달한다. 브라우저가 보낸 장소명이나 좌표를 그대로 저장하지 않는다.

처리 순서:

1. `getUser()`로 인증된 사용자 ID를 확인한다.
2. 검색어와 장소 ID를 검증한다.
3. 같은 검색어로 Kakao API를 서버에서 다시 호출해 해당 ID의 결과를 찾는다.
4. 장소명, 주소, 경도, 위도를 provider 응답에서 가져오고 좌표 범위를 검증한다.
5. `owner_id`는 검증된 `user.id`, `provider`는 `kakao`로 고정한다.
6. `places`에 삽입한다.
7. `/places`와 `/records/new`를 revalidate한다.

저장 필드:

```text
owner_id
name
address
latitude
longitude
provider = kakao
provider_place_id
region = null
district = null
```

Kakao 키워드 응답에는 구조화된 시·도와 구 필드가 없으므로 이번 단계에서 주소 문자열을 임의로 분해하지 않는다.

## 데이터베이스

동일 장소의 중복 저장을 애플리케이션 조회만으로 막지 않고 다음 partial unique index를 migration으로 추가한다.

```text
(owner_id, provider, provider_place_id) where provider is not null
```

- 기존 places RLS 정책을 유지한다.
- migration 적용 후 TypeScript 데이터베이스 타입을 다시 확인한다.
- 중복 제약 오류는 "이미 저장한 장소예요"로 표시한다.

## UI

- 기존 Forest Green 토큰과 모바일 390px 구성을 유지한다.
- 상단에는 뒤로가기, 제목, 저장된 장소 수를 표시한다.
- 검색 폼은 shadcn/ui `Field`, `Input`, `Button`, `Spinner`를 재사용한다.
- 저장된 장소와 검색 결과는 `Card`로 구분한다.
- 빈 상태와 결과 없음은 shadcn/ui `Empty`를 사용한다.
- 아이콘은 `MapPin`, `Search`, `Plus`, `ChevronLeft` 등 Lucide를 개별 import한다.
- 의미 있는 버튼에는 텍스트 또는 접근 가능한 이름을 제공한다.
- Base UI 입력은 controlled 또는 일관된 uncontrolled 방식 하나만 유지한다.

## 구조

```text
app → _pages → features → shared
```

- `app/(app)/places/page.tsx`는 `_pages`를 렌더링하는 얇은 진입점으로 유지한다.
- Kakao 요청과 응답 변환은 `shared/api/kakao-local`에 둔다.
- 장소 저장 Action과 입력 검증은 `features/create-place`에 둔다.
- 목록 조회, 검색 파라미터 처리, 화면 조립은 `_pages/places`에 둔다.
- 한 번만 쓰는 repository, provider interface, custom hook은 만들지 않는다.

## 보안

- 검색과 저장 모두 서버에서만 Kakao API를 호출한다.
- Server Action 내부에서 인증을 다시 확인한다.
- 브라우저가 보낸 `owner_id`, 장소명, 주소, 좌표, provider를 신뢰하지 않는다.
- 외부 API와 데이터베이스 오류 원문을 사용자에게 노출하지 않는다.
- 저장 시 RLS와 owner 필터를 함께 적용한다.
- Supabase Security Advisor를 다시 확인한다.

## 제외 범위

- 현재 위치 기반 검색
- 자동완성과 입력 중 검색
- 검색 결과 페이지네이션
- 지도 SDK와 지도 미리보기
- 직접 장소 입력
- 장소 이름 수정
- 장소 삭제
- 장소 상세 화면
- region/district 보강
- 여러 장소 provider 추상화

## 검증

- 검색어 trim, 빈 검색어와 100자 초과 거부
- Kakao 정상 응답 변환과 잘못된 좌표 거부 최소 테스트
- 키 미설정과 provider 실패 오류 처리
- 정상 저장과 동일 장소 중복 거부
- 비로그인 Action 요청 거부
- 다른 사용자 데이터 격리
- 저장 후 목록과 `/records/new` 갱신
- Biome import/format check
- lint
- TypeScript type check
- production build
- Supabase Security Advisor

## 완료 후 다음 플랜

장소 저장이 완성되면 홈의 mock 위치를 실제 `records → places(latitude, longitude)` 조회로 교체하고, 기록이 없는 상태와 실제 발자취를 대한민국 지도에 연결한다.
