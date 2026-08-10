# Conventions

## Naming

| 대상                 | 규칙                  | 예시                    |
| -------------------- | --------------------- | ----------------------- |
| React 컴포넌트       | `PascalCase`          | `RecordCard`            |
| 컴포넌트 파일        | `kebab-case.tsx`      | `record-card.tsx`       |
| 함수와 변수          | `camelCase`           | `getRecord`, `recordId` |
| 타입                 | `PascalCase`          | `RecordFormProps`       |
| 상수                 | `UPPER_SNAKE_CASE`    | `MAX_RECORDS`           |
| 일반 TypeScript 파일 | `kebab-case.ts`       | `format-date.ts`        |
| 훅                   | `use-*.ts`            | `use-records.ts`        |
| 테스트               | 대상 파일명 + `.test` | `record-card.test.tsx`  |

파일명과 export 이름은 다음처럼 구분한다.

```tsx
// record-card.tsx
export function RecordCard() {
  return <article />;
}
```

## Component

- 단일 컴포넌트보다 역할 단위로 분리된 작은 컴포넌트를 선호한다. 한 컴포넌트가 여러 역할을 맡거나 prop이 계속 늘어나면 역할별로 파일을 분리한다.

## Next.js

- 예약 파일은 Next.js 이름을 그대로 사용한다: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
- URL 경로 폴더는 `kebab-case`를 사용한다: `account-settings/`.
- 동적 경로 이름은 `camelCase`를 사용한다: `[recordId]/`.
- Route Group은 역할을 짧게 표현한다: `(app)`, `(auth)`.
- `page.tsx`와 `layout.tsx`는 조립에 집중하고, 재사용되는 UI만 별도 컴포넌트로 분리한다.

## Feature-Sliced Design

`src/app`은 Next.js 라우팅 전용으로 두고, 실제 화면과 비즈니스 코드는 FSD 레이어에 둔다.

```text
src/
├── app/       # Next.js 라우트와 레이아웃
├── _pages/    # 페이지 단위 화면 조합
├── features/  # 사용자의 재사용 가능한 행동
├── entities/  # record, person, place 같은 도메인
└── shared/    # 도메인에 의존하지 않는 공용 코드
```

- 필요한 레이어와 slice만 만들고 빈 폴더를 미리 생성하지 않는다.
- 의존성은 `app → _pages → features → entities → shared` 방향만 허용한다.
- 같은 레이어의 서로 다른 slice끼리는 직접 import하지 않는다.
- slice 내부는 필요에 따라 `ui`, `model`, `api`, `lib` segment로 나눈다.
- 외부에서는 slice의 `index.ts`에 공개된 API만 import한다.
- `src/app/**/page.tsx`는 대응하는 `_pages` 화면을 가져와 렌더링하는 얇은 진입점으로 유지한다.
- `processes`는 사용하지 않는다. `widgets`는 여러 페이지에서 재사용되는 큰 UI 블록이 생길 때만 추가한다.

## Exports

- Next.js 예약 파일은 `default export`를 사용한다.
- 그 외 컴포넌트와 함수는 이름 변경이 쉬운 `named export`를 사용한다.
- 한 곳에서만 쓰는 코드는 미리 공용화하지 않는다.
