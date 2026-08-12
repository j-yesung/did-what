# 다음 단계: 사람 상세와 함께한 기록

## 시작 전 확인

기록 수정 기능이 사용하는 `supabase/migrations/20260812090000_update_owned_record.sql`을 연결된 Supabase 프로젝트에 먼저 적용하고 Security Advisor를 확인한다.

## 목적

사람 목록에서 한 사람을 선택해 기본 정보와 그 사람과 함께 남긴 기록을 시간순으로 돌아볼 수 있게 한다.

이번 단계는 사람 상세 조회와 관련 기록 이동까지만 구현한다. 사람 수정·삭제나 통계는 실제 필요가 생긴 뒤 추가한다.

## 완료 조건

- 사람 목록의 각 카드에서 `/people/[personId]`로 이동할 수 있다.
- 상세 화면에 사람 이름과 추가일이 표시된다.
- 해당 사람과 함께한 현재 사용자의 기록만 최신순으로 표시된다.
- 기록 카드에서 기존 `/records/[recordId]` 상세 화면으로 이동할 수 있다.
- 관련 기록이 없으면 다음 행동을 안내하는 빈 상태를 표시한다.
- 잘못된 UUID와 다른 사용자의 person ID는 동일하게 404 처리한다.
- 목록과 상세 조회 오류를 사용자에게 안전한 한국어 메시지로 표시한다.

## 조회 흐름

1. `personId` UUID 형식을 먼저 확인한다.
2. `getUser()`로 인증 사용자를 확인한다.
3. `people.id`, `people.owner_id`로 현재 사용자의 사람 한 명을 조회한다.
4. `record_people`에서 해당 person과 연결된 records, place를 최신 날짜순으로 조회한다.
5. 사람 정보와 기록 목록은 독립 쿼리로 동시에 시작한다.
6. 다른 사용자 데이터는 RLS와 owner 필터로 이중 차단한다.

## UI

- 기존 Forest Green 토큰과 모바일 화면 구성을 유지한다.
- 사람 목록 카드에 `ChevronRight`와 `함께한 기록 보기` 텍스트 링크를 추가한다.
- 상세 상단은 `UserRound`와 Avatar로 사람을 식별한다.
- 관련 기록은 기존 기록 목록의 날짜·장소·활동 표현을 재사용한다.
- `CalendarDays`, `MapPin`, `NotebookPen`, `ChevronRight`를 `lucide-react`에서 개별 import한다.
- 빈 상태와 오류는 기존 shadcn/ui `Empty`, `Alert`를 사용한다.
- 직접 SVG나 다른 아이콘 라이브러리를 추가하지 않는다.

## 구조

```text
app → pages → entities → shared
```

- `app/(app)/people/[personId]/page.tsx`는 화면 re-export만 둔다.
- 조회와 화면 조립은 `src/pages/person-detail`에 둔다.
- 사람 단건과 관련 기록 조회는 기존 `entities/person` 공개 API에 최소한으로 추가한다.
- 같은 레이어 slice 간 import는 만들지 않는다.

## 제외 범위

- 사람 이름 수정과 삭제
- 관계 유형 관리
- 프로필 사진 업로드
- 사람별 기록 통계
- 사람별 지도 필터
- 기록 검색·필터·페이지네이션
- 무한 스크롤
- 실시간 동기화

## 검증

- 관련 기록이 있는 사람 상세
- 관련 기록이 없는 사람 빈 상태
- 기록 상세 링크 이동
- 존재하지 않는 UUID
- 다른 사용자의 person ID 접근 차단
- 비로그인 접근 차단
- Biome import/format check
- lint
- TypeScript type check
- production build

## 완료 후 다음 플랜

사람 상세가 완성되면 `/places/[placeId]`를 장소 상세와 해당 장소의 기록 목록에 연결한다.
