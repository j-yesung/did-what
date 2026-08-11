# 다음 단계: 사람 목록과 추가 연결

## 목적

`/people` placeholder를 실제 Supabase 데이터에 연결해 사용자가 기록에 함께한 사람을 직접 준비할 수 있게 한다.

이번 단계는 목록 조회와 새 사람 추가까지만 구현한다. 이름 수정과 삭제는 실제 기록과의 관계 보존 정책을 정한 뒤 추가한다.

## 완료 조건

- `/people`에서 현재 사용자의 사람 목록을 확인할 수 있다.
- 이름을 입력해 새 사람을 추가할 수 있다.
- 생성한 사람은 `/records/new` 선택지에 바로 나타난다.
- 다른 사용자의 사람은 조회하거나 생성 결과에 섞이지 않는다.
- 입력 오류와 저장 오류를 폼 안에 한국어로 표시한다.
- 빈 목록에서 첫 사람을 추가할 수 있는 명확한 안내를 제공한다.
- 중복 제출을 막는다.

## 데이터 조회

Server Component에서 다음 필드만 조회한다.

```text
people: id, name, created_at
```

- `getUser()`로 현재 사용자를 확인한다.
- `owner_id = user.id`와 RLS를 함께 적용한다.
- 이름순으로 정렬한다.
- 별도의 client fetch나 전역 store를 만들지 않는다.

## 사람 추가

필수 입력:

- 이름

검증:

- 앞뒤 공백을 제거한다.
- 1자 이상 50자 이하만 허용한다.
- 같은 이름의 서로 다른 사람이 있을 수 있으므로 이름 unique 제약은 만들지 않는다.

Server Action 처리 순서:

1. `getUser()`로 인증된 사용자 ID를 확인한다.
2. 이름을 검증한다.
3. `owner_id`를 검증된 `user.id`로 설정한다.
4. `people`에 삽입한다.
5. `/people`과 `/records/new`를 revalidate한다.

## UI

- 기존 Forest Green 토큰과 모바일 390px 구성을 유지한다.
- 상단에는 뒤로가기, 제목, 현재 사람 수를 표시한다.
- 추가 폼은 shadcn/ui `Field`, `Input`, `Button`, `Spinner`를 재사용한다.
- 목록은 `Card`와 `AvatarFallback`을 사용한다.
- 빈 상태는 이미 추가된 shadcn/ui `Empty`를 사용한다.
- 아이콘은 `UserRound`, `Users`, `Plus`, `ChevronLeft` 등 Lucide를 개별 import한다.
- 오류 대상에는 `data-invalid`, `aria-invalid`, 접근 가능한 오류 메시지를 적용한다.

## 구조

```text
app → _pages → features → shared
```

- `app/(app)/people/page.tsx`는 `_pages`를 렌더링하는 얇은 진입점으로 유지한다.
- 사람 생성 Action과 검증은 `features/create-person`에 둔다.
- 목록 조회와 화면 조립은 `_pages/people`에 둔다.
- 한 번만 쓰는 repository나 custom hook은 만들지 않는다.

## 보안

- Server Action 내부에서 인증을 다시 확인한다.
- 브라우저가 보낸 `owner_id`를 받거나 신뢰하지 않는다.
- 데이터베이스 오류 원문을 사용자에게 노출하지 않는다.
- 기존 people RLS 정책을 유지하고 Security Advisor를 다시 확인한다.

## 제외 범위

- 사람 이름 수정
- 사람 삭제
- 관계 유형
- 프로필 사진
- 사람 상세 화면
- 기록별 사람 통계
- 검색·정렬 옵션
- 페이지네이션
- Place CRUD 및 장소 검색

## 검증

- 정상 생성
- 빈 이름과 50자 초과 거부
- 앞뒤 공백 제거
- 중복 제출 방지
- 비로그인 Action 요청 거부
- 다른 사용자 데이터 격리
- 생성 후 목록과 `/records/new` 갱신
- 입력 검증 최소 테스트
- Biome import/format check
- lint
- TypeScript type check
- production build
- Supabase Security Advisor

## 완료 후 다음 플랜

사람 추가가 완성되면 장소 검색 provider를 하나 선정하고 `/places` 검색·저장 흐름을 설계한다. provider 선택 전 공식 API의 대한민국 주소 품질, 좌표 체계, 호출 제한, 키 노출 방식을 확인한다.
