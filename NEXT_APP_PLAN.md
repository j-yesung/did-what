# 다음 단계: 실제 기록 저장 연결

## 목적

현재 `/records/new`의 mock 사람·장소와 입력 검증 완료 안내를 실제 Supabase 조회·저장 흐름으로 교체한다.

인증된 사용자의 기존 `people`, `places`만 선택할 수 있게 하고, 저장한 기록은 `/records`의 최소 목록에서 바로 확인할 수 있게 한다. 사람·장소 생성과 장소 검색은 다음 단계로 남긴다.

## 완료 조건

- `/records/new`가 현재 사용자의 `people`, `places`를 서버에서 조회한다.
- mock ID를 제거하고 실제 UUID를 폼 값으로 사용한다.
- 입력값과 선택한 데이터의 소유권을 서버에서 다시 검증한다.
- `records`와 `record_people`에 실제 데이터가 저장된다.
- 연결 저장 실패 시 불완전한 `records` 행을 남기지 않는다.
- 중복 제출을 막고 오류를 폼 안에 한국어로 표시한다.
- 성공하면 `/records`로 이동하고 저장한 기록이 최신순으로 보인다.
- 다른 사용자의 사람·장소·기록은 조회하거나 연결할 수 없다.

## 데이터 조회

`/records/new` 진입 시 Server Component에서 다음을 조회한다.

```text
people: id, name
places: id, name, address
```

- `getUser()`로 현재 사용자를 확인한다.
- RLS를 통과한 현재 사용자 데이터만 사용한다.
- 사람은 이름순, 장소는 이름순으로 정렬한다.
- 브라우저에서 별도 Supabase 조회나 전역 store를 만들지 않는다.

## 빈 상태

사람 또는 장소가 하나도 없으면 저장 가능한 것처럼 빈 form을 보여주지 않는다.

- 사람 없음: `/people`로 이동하는 안내를 제공한다.
- 장소 없음: `/places`로 이동하는 안내를 제공한다.
- 이번 단계에서 People CRUD와 Place CRUD를 함께 구현하지 않는다.

## 입력 모델

현재 검증된 모델을 유지한다.

```ts
type RecordFormValues = {
  recordedAt: string;
  personIds: string[];
  placeId: string;
  activity: string;
  memo?: string;
};
```

- `recordedAt`은 유효한 날짜여야 한다.
- `personIds`는 한 명 이상이며 중복을 제거한다.
- `placeId`와 모든 `personIds`는 UUID 형식이어야 한다.
- `activity`는 공백 제거 후 1~120자다.
- `memo`는 공백 제거 후 빈 값이면 `null`, 최대 500자다.
- HTML 기본 검증과 Server Action 검증을 함께 사용한다.

## 저장 Action

서버에서 다음 순서로 처리한다.

1. `getUser()`로 인증된 사용자 ID를 얻는다.
2. 입력값을 검증한다.
3. 선택한 `placeId`와 모든 `personIds`가 현재 사용자 소유인지 조회한다.
4. `records.owner_id`는 입력값이 아니라 검증된 `user.id`로 설정한다.
5. `records`를 생성한다.
6. 선택한 사람을 `record_people`에 한 번에 삽입한다.
7. 연결 삽입 실패 시 방금 만든 record를 삭제해 반쪽 저장을 정리한다.
8. 성공하면 `/records`로 redirect하고 목록을 갱신한다.

별도 상태 관리 라이브러리나 service role key는 사용하지 않는다.

## 기록 목록

`/records` placeholder를 최소 실제 목록으로 교체한다.

- 현재 사용자의 기록을 `recorded_at DESC`, `created_at DESC`로 조회한다.
- 날짜, 활동, 장소 이름, 함께한 사람 이름을 표시한다.
- 데이터가 없으면 `/records/new`로 이동하는 empty state를 표시한다.
- 페이지네이션, 검색, 필터는 아직 추가하지 않는다.
- 기록 상세 `/records/[recordId]`는 이번 범위에 포함하지 않는다.

## 구조

현재 FSD 의존 방향을 유지한다.

```text
app → _pages → features → shared
```

- `src/app/**/page.tsx`는 얇은 진입점으로 유지한다.
- 기록 생성 Action과 제출 UI는 실제 필요 범위에서만 `features`로 분리한다.
- 조회 조립은 대응하는 `_pages` slice에 둔다.
- 한 번만 쓰는 repository, service, hook abstraction은 만들지 않는다.

## UI

- 기존 Forest Green 토큰과 현재 `/records/new` 구성을 유지한다.
- shadcn/ui 공용 컴포넌트를 재사용한다.
- 추가 컴포넌트가 필요하면 shadcn CLI로 필요한 것만 추가한다.
- 아이콘은 `lucide-react`에서 개별 import한다.
- 제출 중 버튼 비활성화와 Spinner를 표시한다.
- 오류 메시지는 접근성 트리에 포함하고 첫 오류로 이동할 수 있게 한다.
- 모바일 390px을 우선한다.

## 보안 및 데이터 무결성

- 브라우저가 보낸 `owner_id`를 신뢰하지 않는다.
- RLS에 더해 Server Action에서도 사람·장소 소유권을 확인한다.
- 존재하지 않거나 다른 사용자 소유인 ID는 동일한 일반 오류로 처리한다.
- `record_people` 중복 ID는 저장 전에 제거한다.
- 관계 저장 실패 시 생성한 record 삭제 결과도 확인한다.
- Supabase security advisor를 다시 확인한다.

## 제외 범위

- People CRUD
- Place CRUD 및 장소 검색 API
- 기록 수정·삭제·상세
- 사진 및 Storage
- 홈 지도 실제 DB 연결
- 페이지네이션·검색·필터
- optimistic update
- 별도 전역 상태 관리
- DB seed/mock 삽입

## 검증

- 정상 기록 저장
- 필수값 및 길이 검증 실패
- 사람 미선택
- 중복 person ID 제거
- 다른 사용자 소유 ID 거부
- 관계 저장 실패 시 record 정리
- 중복 제출 방지
- 빈 데이터 안내
- `/records` 최신순 목록
- 입력 검증 최소 테스트
- Biome import/format check
- lint
- TypeScript type check
- production build
- Supabase security advisor

## 완료 후 다음 플랜

저장 흐름이 완성되면 앱 안에서 참조 데이터를 준비할 수 있도록 People CRUD와 Place 입력·검색 방식을 설계한다. 장소 provider는 API 키, 좌표 정확도, 대한민국 주소 구조를 확인한 뒤 하나만 선택한다.
