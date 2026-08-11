# 다음 단계: 기록 상세 화면 연결

## 목적

`/records/[recordId]` placeholder를 실제 Supabase 기록에 연결하고, 기록 목록에서 선택한 추억의 전체 내용을 확인할 수 있게 한다.

이번 단계는 상세 조회와 목록에서 상세로 이동하는 흐름까지만 구현한다. 수정과 삭제는 상세 화면이 안정된 뒤 추가한다.

## 완료 조건

- `/records`의 각 기록에서 상세 화면으로 이동할 수 있다.
- 상세 화면에 활동, 날짜, 함께한 사람, 장소, 메모가 표시된다.
- 메모가 없는 기록은 빈 영역이나 임시 문구 없이 자연스럽게 표시된다.
- 현재 사용자의 기록만 조회할 수 있다.
- 존재하지 않거나 접근할 수 없는 기록은 not found로 처리한다.
- 조회 실패 시 데이터베이스 오류 원문 대신 한국어 안내를 표시한다.

## 데이터 조회

동적 경로의 `recordId`로 다음 필드만 조회한다.

```text
records
├── id
├── activity
├── recorded_at
├── memo
├── place:places(name, address)
└── record_people
    └── person:people(name)
```

- `getUser()`로 현재 사용자를 다시 확인한다.
- `recordId`가 UUID 형식이 아니면 조회하지 않고 not found로 처리한다.
- `id = recordId`와 `owner_id = user.id`를 함께 적용한다.
- 기존 records, places, people, record_people RLS를 함께 사용한다.
- 상세 화면에 쓰지 않는 좌표, provider, 생성·수정 시각은 조회하지 않는다.
- 별도 API route나 client fetch는 만들지 않는다.

## 화면 흐름

1. `/records` 카드에 상세 이동 링크를 추가한다.
2. `/records/[recordId]`에서 인증과 소유권을 확인해 한 건을 조회한다.
3. 기록이 없으면 `notFound()`를 호출한다.
4. 정상 응답이면 날짜, 사람, 장소, 활동, 메모 순서로 읽기 쉽게 표시한다.
5. 상단 뒤로가기는 `/records`로 이동한다.

## UI

- 기존 Forest Green 토큰과 모바일 390px 구성을 유지한다.
- 상단에는 뒤로가기와 `기록 상세` 제목을 표시한다.
- 핵심 활동을 페이지 제목으로 강조한다.
- 날짜, 사람, 장소는 Lucide `CalendarDays`, `Users`, `MapPin` 아이콘과 텍스트를 함께 사용한다.
- 메모는 값이 있을 때만 별도 `Card` 영역으로 표시한다.
- 조회 오류는 shadcn/ui `Alert`로 표시한다.
- 목록의 상세 이동은 shadcn/ui `Button`과 Next.js `Link`를 조합한다.
- 직접 SVG나 다른 아이콘 라이브러리를 추가하지 않는다.

## 구조

```text
app → _pages → shared
```

- `app/(app)/records/[recordId]/page.tsx`는 `_pages`를 렌더링하는 얇은 진입점으로 유지한다.
- 조회와 화면 조립은 `_pages/record-detail`에 둔다.
- 한 화면에서만 쓰는 repository, hook, entity 추상화는 만들지 않는다.
- 날짜 formatter는 모듈 단위 상수로 둔다.

## 보안

- URL의 `recordId`를 신뢰하지 않고 소유자 필터와 RLS로 검증한다.
- 다른 사용자의 기록, 사람, 장소가 관계 조회에 포함되지 않게 한다.
- 접근 권한이 없는 기록과 존재하지 않는 기록을 같은 not found 응답으로 처리한다.
- Supabase 오류 원문을 사용자에게 노출하지 않는다.

## 제외 범위

- 기록 수정
- 기록 삭제
- 사진과 Storage
- 장소 지도 미리보기
- 이전·다음 기록 이동
- 공유 링크
- 댓글과 반응
- 상세 화면 실시간 구독

## 검증

- 정상 기록 상세 조회
- 메모가 있는 기록과 없는 기록
- 여러 사람이 연결된 기록
- 존재하지 않는 record ID
- 다른 사용자 record ID 접근 차단
- 목록에서 상세 화면 이동
- 비로그인 접근 차단
- Biome import/format check
- lint
- TypeScript type check
- production build
- Supabase Security Advisor

## 완료 후 다음 플랜

기록 상세 화면이 완성되면 상세 화면에서 기록 수정과 삭제를 안전하게 수행하는 흐름을 설계한다.
