# 다음 단계: 기록 수정과 삭제

## 목적

기록 상세 화면에서 잘못 남긴 내용을 수정하거나 더 이상 필요하지 않은 기록을 안전하게 삭제할 수 있게 한다.

이번 단계는 기록 한 건의 전체 입력 수정과 명시적인 삭제 확인까지 구현한다. 복구, 변경 이력, 일괄 작업은 실제 필요가 생긴 뒤 추가한다.

## 완료 조건

- 기록 상세 화면에서 수정 화면으로 이동할 수 있다.
- 기존 날짜, 사람, 장소, 활동, 메모가 수정 폼의 초기값으로 표시된다.
- 수정 결과가 records와 record_people에 원자적으로 반영된다.
- 기록 상세 화면에서 확인 절차를 거쳐 기록을 삭제할 수 있다.
- 수정·삭제 후 목록과 홈 지도가 즉시 갱신된다.
- 다른 사용자의 기록은 수정하거나 삭제할 수 없다.
- 실패 시 부분 수정이나 사람 연결 유실이 남지 않는다.

## 수정 흐름

`/records/[recordId]/edit` 동적 경로를 추가한다.

1. `recordId` 형식과 인증 사용자를 확인한다.
2. 현재 사용자의 기록, 사람 목록, 장소 목록을 조회한다.
3. 기존 값을 수정 폼 초기값으로 전달한다.
4. Server Action에서 기존 `validateRecordInput`을 재사용한다.
5. 선택한 사람과 장소가 모두 현재 사용자의 데이터인지 다시 확인한다.
6. record 필드와 record_people 연결을 하나의 데이터베이스 트랜잭션으로 갱신한다.
7. `/`, `/records`, `/records/[recordId]`를 revalidate하고 상세 화면으로 이동한다.

## 원자적 갱신

records update와 record_people 교체를 여러 Supabase 요청으로 순차 실행하지 않는다.

- migration으로 최소한의 Postgres function을 추가한다.
- function은 record ID, 날짜, 장소 ID, 활동, 메모, 사람 ID 배열을 받는다.
- 현재 `auth.uid()`가 record, place, people의 소유자인지 검증한다.
- record_people 삭제와 재삽입을 같은 트랜잭션에서 수행한다.
- `security invoker`와 고정된 `search_path`를 사용하고 authenticated에 필요한 실행 권한만 부여한다.
- 실패하면 전체 변경을 rollback한다.

## 삭제 흐름

1. 상세 화면에서 `삭제` 버튼을 누르면 shadcn/ui `AlertDialog`를 연다.
2. 기록 활동명을 포함한 한국어 경고와 되돌릴 수 없다는 설명을 표시한다.
3. 확인 버튼을 눌렀을 때만 Server Action을 실행한다.
4. Action에서 인증과 `owner_id`를 다시 확인해 records 한 건을 삭제한다.
5. 기존 foreign key cascade로 record_people을 함께 정리한다.
6. `/`와 `/records`를 revalidate하고 기록 목록으로 이동한다.

## UI

- 기존 Forest Green 토큰과 모바일 390px 구성을 유지한다.
- 상세 화면에 `Pencil`, `Trash2` Lucide 아이콘과 텍스트가 있는 수정·삭제 버튼을 제공한다.
- 수정 화면은 새 기록 작성 화면의 입력 순서와 조작 방식을 유지한다.
- 폼은 shadcn/ui `Field`, `Input`, `Checkbox`, `NativeSelect`, `Textarea`, `Button`, `Spinner`를 재사용한다.
- 삭제 확인은 shadcn CLI로 `AlertDialog`를 추가해 공용 컴포넌트로 사용한다.
- 파괴적 버튼은 destructive variant를 사용한다.
- 직접 SVG나 다른 아이콘 라이브러리를 추가하지 않는다.

## 구조

```text
app → _pages → features → shared
```

- `app/(app)/records/[recordId]/edit/page.tsx`는 얇은 진입점으로 유지한다.
- 수정 화면 조회와 조립은 `_pages/record-edit`에 둔다.
- update/delete Server Action은 record 관리 feature에 둔다.
- 기존 record 입력 검증과 타입을 재사용한다.
- 새 기록 폼과 수정 폼의 공통 UI는 실제 중복을 줄이는 범위에서만 분리한다.

## 보안

- URL과 formData의 record ID, owner ID, 사람·장소 정보를 신뢰하지 않는다.
- 모든 Action에서 `getUser()`와 owner 필터를 다시 적용한다.
- 데이터베이스 function에서도 `auth.uid()`로 소유권을 검증한다.
- 접근할 수 없는 기록은 존재하지 않는 기록과 동일하게 처리한다.
- 데이터베이스 오류 원문을 사용자에게 노출하지 않는다.

## 제외 범위

- soft delete와 휴지통
- 삭제 취소와 복구
- 변경 이력
- 여러 기록 일괄 수정·삭제
- 목록에서 바로 수정하는 inline edit
- 사진과 Storage
- optimistic update
- 실시간 동기화

## 검증

- 기존 값이 채워진 수정 화면
- 날짜, 사람, 장소, 활동, 메모 수정
- 메모 제거
- record_people 교체의 원자성
- 정상 삭제와 record_people cascade
- 수정·삭제 후 홈과 목록 갱신
- 존재하지 않는 record ID
- 다른 사용자 record ID 접근 차단
- 비로그인 Action 차단
- migration 적용 결과
- Biome import/format check
- lint
- TypeScript type check
- production build
- Supabase Security Advisor

## 완료 후 다음 플랜

기록 수정과 삭제가 완성되면 `/people/[personId]`를 사람 상세와 함께한 기록 목록에 연결한다.
