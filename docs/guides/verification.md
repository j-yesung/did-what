# 검증 가이드

변경 범위에 맞는 가장 작은 검증부터 실행한다. 프로덕션 빌드는 빌드 과정에 영향을 주는 변경에서만 사용한다.

## 코드 정리

코드 파일을 생성하거나 수정했다면 다음 명령으로 포맷, import와 Tailwind class 정렬, 안전한 lint 수정을 적용한다.

```bash
pnpm exec biome check --write src app
```

`src`, `app` 밖의 코드도 수정했다면 해당 경로를 명령에 추가한다. 문서만 수정한 경우에는 실행하지 않는다.

자동 수정 후 남은 진단은 다음 명령으로 확인한다.

```bash
pnpm lint
```

## 타입 검사

타입, 컴포넌트 경계, 함수 시그니처, 데이터 구조를 변경했다면 실행한다.

```bash
pnpm exec tsc --noEmit
```

텍스트, 문서, CSS 값만 변경한 경우에는 생략할 수 있다.

## 테스트

변경한 동작과 관련된 테스트가 있으면 해당 파일을 우선 실행한다.

```bash
pnpm test src/path/to/example.test.mjs
```

공용 로직이 여러 기능에 영향을 주거나 전체 테스트 실행을 요청받은 경우에는 전체 테스트를 실행한다.

```bash
pnpm test
```

## 프로덕션 빌드

다음처럼 Next.js의 빌드 결과나 서버·클라이언트 경계에 영향을 주는 변경에서 실행한다.

- `next.config.*`, `proxy.ts`, 빌드 관련 `package.json` 설정
- Next.js, React 또는 주요 build dependency 버전
- Server Component와 Client Component 경계 또는 `"use client"`
- SSR, SSG, ISR, dynamic rendering, `generateStaticParams`, `generateMetadata`
- route handler, Server Action, 환경변수 사용 방식
- module resolution, alias, dynamic import, code splitting
- 배포 직전 전체 검증을 명시적으로 요청받은 경우

```bash
pnpm build
```

CSS, 문구, 아이콘, 단순 UI 조합, 테스트, 타입 선언, 내부 리팩터링만 변경했다면 원칙적으로 빌드하지 않는다. 빌드가 한 번 성공한 뒤 build-sensitive 코드가 바뀌지 않았다면 반복하지 않는다.

## 선택 순서

필요한 단계까지만 아래 순서로 실행한다.

```text
관련 코드 정적 검토
→ 관련 테스트
→ lint
→ typecheck
→ production build
```

사용자가 특정 검증이나 전체 검증을 요청한 경우에는 해당 요청을 우선한다.
