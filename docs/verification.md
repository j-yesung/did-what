# Verification Guidelines

이 프로젝트에서는 검증을 위해 불필요하게 프로덕션 빌드를 실행하지 않는다.

## 기본 원칙

* `pnpm build`, `next build` 등 프로덕션 빌드는 기본 검증 수단으로 사용하지 않는다.
* 단순 UI 수정, 스타일 변경, 컴포넌트 수정 등의 작업에서는 프로덕션 빌드를 실행하지 않는다.
* 변경 범위에 맞는 가장 작은 검증 방법을 우선 사용한다.
* 동일한 검증 명령을 특별한 이유 없이 반복 실행하지 않는다.
* 검증을 위해 개발 서버를 불필요하게 여러 번 실행하지 않는다.
* 이미 성공한 검증은 관련 코드가 다시 변경되지 않았다면 재실행하지 않는다.

## 기본 검증 순서

가능한 경우 아래 순서로 최소 범위만 검증한다.

```bash
pnpm lint
```

타입 검증이 별도로 필요한 경우:

```bash
pnpm typecheck
```

프로젝트에 `typecheck` script가 없다면 필요에 따라:

```bash
pnpm exec tsc --noEmit
```

테스트가 존재하고 변경 범위와 관련된 경우에는 전체 테스트보다 관련 테스트를 우선 실행한다.

```bash
pnpm test <target>
```

## 프로덕션 빌드를 실행하지 않아도 되는 경우

다음 변경에서는 원칙적으로 `pnpm build`를 실행하지 않는다.

* CSS 또는 스타일 수정
* Tailwind class 수정
* 텍스트 또는 문구 변경
* 아이콘 변경
* 단순 UI 컴포넌트 수정
* Storybook story 수정
* 테스트 코드만 수정
* 타입 선언의 단순 수정
* mock 데이터 수정
* 기존 컴포넌트 조합 변경
* 페이지 레이아웃의 단순 변경
* client component 내부 로직 수정
* lint 또는 formatting 관련 변경
* 파일명 또는 내부 구조의 단순 리팩터링

이러한 경우에는 lint, typecheck, 관련 테스트 등으로 검증한다.

## 프로덕션 빌드가 필요한 경우

다음과 같이 실제 Next.js 빌드 결과에 영향을 줄 가능성이 높은 경우에만 `pnpm build`를 실행한다.

* `next.config.*` 변경
* Next.js 버전 변경
* React 버전 변경
* 주요 dependency 또는 build dependency 변경
* `package.json`의 build 관련 설정 변경
* Server Component / Client Component 경계 변경
* `"use client"` 추가 또는 제거
* SSR / SSG / ISR 동작 변경
* `generateStaticParams` 변경
* `generateMetadata` 변경
* dynamic rendering 관련 설정 변경
* route handler 또는 server action의 구조적 변경
* middleware 변경
* instrumentation 변경
* 환경변수가 빌드 결과에 영향을 주는 변경
* webpack 또는 Turbopack 관련 설정 변경
* module resolution / alias 설정 변경
* dynamic import 또는 code splitting 관련 변경
* 빌드 시점에만 발견될 가능성이 높은 오류를 확인해야 하는 경우
* 배포 직전 최종 검증을 명시적으로 요청받은 경우

## Build 실행 전 판단

`pnpm build`를 실행하기 전에 반드시 다음을 판단한다.

1. 현재 변경이 실제 프로덕션 빌드 과정에 영향을 주는가?
2. lint, typecheck 또는 관련 테스트만으로 검증할 수 없는가?
3. 빌드를 실행해야만 확인 가능한 문제가 존재하는가?

세 조건 중 명확한 이유가 없다면 프로덕션 빌드를 실행하지 않는다.

## Build 반복 금지

한 작업 중 `pnpm build`가 성공했다면 관련 build-sensitive 코드가 다시 변경되지 않는 이상 다시 실행하지 않는다.

다음과 같은 패턴을 피한다.

```text
코드 수정
→ pnpm build
→ 사소한 CSS 수정
→ pnpm build
→ 문구 수정
→ pnpm build
```

대신:

```text
코드 수정
→ 필요한 lint/typecheck/test 수행
→ 작업 완료 시 필요한 경우에만 pnpm build 1회
```

형태로 검증한다.

## Next.js Build Artifacts

프로덕션 빌드는 `.next` 디렉터리에 많은 파일을 생성할 수 있으므로 단순 검증 목적으로 반복 생성하지 않는다.

빌드 산출물을 초기화해야 하는 경우:

```bash
rm -rf .next
```

의존성까지 재설치해야 하는 명확한 문제가 있을 때만:

```bash
pnpm clean:install
```

전체 pnpm store 정리까지 필요한 경우에만:

```bash
pnpm clean:all
```

`clean:all`은 전역 pnpm store까지 정리하므로 일반적인 검증 과정에서는 실행하지 않는다.

## Codex 행동 규칙

Codex는 작업을 완료하기 위해 가능한 가장 저비용의 검증 방법을 선택한다.

검증 우선순위:

```text
관련 코드 정적 검토
→ 관련 테스트
→ lint
→ typecheck
→ production build
```

Production build는 마지막 단계이며, 필요한 근거가 있을 때만 사용한다.

사용자가 명시적으로 프로덕션 빌드 또는 전체 검증을 요청한 경우에는 해당 요청을 우선한다.
