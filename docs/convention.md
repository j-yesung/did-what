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

## 스타일

- 화면과 컴포넌트의 색은 `background`, `foreground`, `surface`, `muted`, `border`, `primary`, `destructive` 같은 시맨틱 토큰으로 참조한다.
- `blue-500`, `grey-100` 같은 Base 팔레트와 raw hex는 `globals.css`의 토큰 정의 밖에서 직접 사용하지 않는다.
- 라이트·다크 모드 차이는 컴포넌트의 `dark:` 색상 덮어쓰기보다 같은 시맨틱 토큰이 모드별 값을 가리키도록 해결한다.

## Next.js

- 예약 파일은 이름을 그대로 쓴다: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
- URL 폴더는 `kebab-case`(`account-settings/`), 동적 경로는 `camelCase`(`[recordId]/`), Route Group은 짧게(`(app)`, `(auth)`).

## Feature-Sliced Design

라우팅은 루트 `app/`, 화면과 비즈니스 코드는 `src/`의 FSD 레이어에 둔다. 배경은 [FSD 공식 Next.js 가이드](https://fsd.how/kr/docs/guides/tech/with-nextjs/) 참고.

```text
app/            # Next.js 라우팅 전용 (page, layout, route)
pages/          # Pages Router 충돌 방지용 placeholder (README.md만 유지)
src/app/        # 전역 스타일, provider, route-handler 구현
src/pages/      # 페이지 단위 화면 조합
src/widgets/    # 독립적인 화면 블록
src/features/   # 사용자의 재사용 가능한 행동
src/entities/   # record, place, region 같은 도메인
src/shared/     # 도메인에 의존하지 않는 공용 코드 (ui, lib, api)
```

- 의존 방향은 `app → pages → widgets → features → entities → shared` 한 방향이다. 같은 레이어의 다른 slice는 import하지 않되, 서버 워크플로를 조합하는 feature만 상대 feature의 `server.ts`를 단방향으로 가져온다.
- 관련 slice는 `pages/record/list`처럼 도메인 namespace 아래 묶는다. namespace 자체에는 공개 API를 두지 않는다.
- 파일 하나로 끝나면 slice 루트에 파일 하나만 둔다. 한 관심사의 파일이 둘 이상으로 늘어나면 그때 폴더로 묶고 `ui`, `model`, `api`, `lib` segment로 나눈다. `notification-bell.tsx`, `notification-bell.model.ts`가 `widgets/` 바닥에 나란히 쌓여 있으면 `widgets/notification-bell/`로 옮길 때다.
- re-export는 최소로 쓴다. `index.ts`는 외부에서 실제로 여러 파일을 가져다 쓰는 slice에만 두고, 그 외에는 파일 경로로 직접 import한다. 배럴 위에 배럴을 얹지 않는다. 루트 `app/**/page.tsx`의 `export { XxxPage as default } from "@/pages/xxx";`가 Next.js 때문에 남는 예외다.
- 서버 전용 slice는 `index.ts`에, 클라이언트용과 서버 전용 API가 섞인 slice는 `server.ts`에 `import "server-only"`를 선언한다. `"use server"` Server Action은 클라이언트가 호출하므로 `index.ts`로 공개해도 된다.
- 서버 전용 모듈(`shared/api/supabase/server`)을 import하는 파일에는 클라이언트가 쓰는 타입을 두지 않는다. 데이터 접근은 `api/`, 타입은 `model/`. 섞으면 클라이언트 컴포넌트가 `next/headers`까지 끌어와 빌드가 깨진다.
- shadcn 컴포넌트는 `shared/ui`, 공용 유틸과 여러 컴포넌트가 함께 쓰는 클래스 상수(`cn`, `PRESS_FEEDBACK`)는 `shared/lib`에 둔다. `src/components`, `src/lib`는 쓰지 않는다.

## Imports

- `@/` alias를 쓴다: `@/shared/ui/button`.
- Node 테스트도 `pnpm test`의 alias loader를 통해 같은 `@/` alias를 사용한다.

## 주석

- 한 줄은 `//`, 여러 줄은 `/** */`를 쓴다.
- 코드가 말하는 것을 되풀이하지 않는다. 왜 이렇게 했는지가 남길 값어치가 있는 내용이다.

## Exports

- Next.js 예약 파일만 `default export`, 나머지는 이름 변경이 쉬운 `named export`를 쓴다.

## 미리 만들지 않기

- 필요해질 때 만든다. 빈 폴더, 쓰지 않는 레이어(`widgets`, `entities`), 한 곳에서만 쓰는 코드의 공용화는 미리 만들지 않는다.
- `processes` 레이어는 쓰지 않는다.
