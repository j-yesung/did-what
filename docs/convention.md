# Conventions

## Naming

| 대상                 | 규칙                       | 예시                    |
| -------------------- | -------------------------- | ----------------------- |
| React 컴포넌트       | `PascalCase`               | `RecordCard`            |
| 타입                 | `PascalCase`               | `RecordFormProps`       |
| 함수와 변수          | `camelCase`                | `getRecord`, `recordId` |
| 상수                 | `UPPER_SNAKE_CASE`         | `MAX_RECORDS`           |
| 파일                 | `kebab-case`               | `record-card.tsx`       |
| 훅                   | `use-*.ts`                 | `use-records.ts`        |
| 테스트               | 대상 파일명 + `.test.mjs`  | `record-form.test.mjs`  |

## 컴포넌트

- 역할 단위로 나눈다. 한 컴포넌트가 여러 역할을 맡거나 prop이 계속 늘어나면 파일을 분리한다.

## Next.js

- 예약 파일은 이름을 그대로 쓴다: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
- URL 폴더는 `kebab-case`(`account-settings/`), 동적 경로는 `camelCase`(`[recordId]/`), Route Group은 짧게(`(app)`, `(auth)`).

## Feature-Sliced Design

라우팅은 루트 `/app`, 화면과 비즈니스 코드는 `/src`의 FSD 레이어에 둔다.
배경은 [FSD 공식 Next.js 가이드](https://fsd.how/kr/docs/guides/tech/with-nextjs/) 참고.

```text
/
├── app/          # Next.js 라우팅 전용 (page, layout, route 등)
├── pages/        # Pages Router 충돌 방지용 placeholder (README.md만 유지)
└── src/
    ├── app/      # FSD App Layer: 전역 스타일, provider, api-routes 구현
    ├── pages/    # 페이지 단위 화면 조합
    ├── features/ # 사용자의 재사용 가능한 행동
    ├── entities/ # record, person, place 같은 도메인
    └── shared/   # 도메인에 의존하지 않는 공용 코드 (ui, lib, api)
```

- 의존 방향은 `app → pages → features → entities → shared` 한 방향이다. 하위 레이어가 상위 레이어를, 같은 레이어의 다른 slice를 import하지 않는다.
- slice는 필요한 segment(`ui`, `model`, `api`, `lib`)만 두고, 외부에서는 `index.ts`의 공개 API로만 가져온다.
- 루트 `app/**/page.tsx`는 `export { XxxPage as default } from "@/pages/xxx";` 형태의 re-export만 둔다.
- shadcn 컴포넌트는 `src/shared/ui`, 공용 유틸은 `src/shared/lib`에 둔다. `src/components`, `src/lib`는 쓰지 않는다.

## Imports

- `@/` alias를 쓴다: `@/shared/ui/button`.
- 단, 테스트(`*.test.mjs`)가 붙은 모듈이 `shared`를 가져올 때는 `#shared/lib/is-uuid.ts`처럼 `#shared/` + 확장자를 쓴다. 테스트를 plain node로 실행하는데 node가 `@/`를 해석하지 못한다. `pnpm test`로 확인한다.

## 주석

- 한 줄은 `//`, 여러 줄은 `/** */`를 쓴다.
- 코드가 말하는 것을 되풀이하지 않는다. 왜 이렇게 했는지가 남길 값어치가 있는 내용이다.

## Exports

- Next.js 예약 파일만 `default export`, 나머지는 이름 변경이 쉬운 `named export`를 쓴다.

## 미리 만들지 않기

- 필요해질 때 만든다. 빈 폴더, 쓰지 않는 레이어(`widgets`, `entities`), 한 곳에서만 쓰는 코드의 공용화는 미리 만들지 않는다.
- `processes` 레이어는 쓰지 않는다.
