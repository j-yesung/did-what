# 다음 단계: Supabase 인증 기반 구축

## 목적

Supabase RLS가 사용하는 `auth.uid()`를 애플리케이션 세션과 연결한다.

이번 단계에서는 `/login`, `/signup`을 실제 Supabase Auth에 연결하고 `(app)` 라우트를 인증된 사용자만 접근할 수 있게 만든다. Record 저장 연결은 인증 기반이 완성된 다음 단계에서 진행한다.

## 완료 조건

- 이메일과 비밀번호로 회원가입할 수 있다.
- 이메일과 비밀번호로 로그인할 수 있다.
- 로그아웃할 수 있다.
- 서버 컴포넌트에서 현재 사용자를 확인할 수 있다.
- 비로그인 사용자는 `(app)` 라우트 접근 시 `/login`으로 이동한다.
- 로그인 사용자는 `/login`, `/signup` 접근 시 홈으로 이동한다.
- 브라우저나 설치된 PWA를 종료했다가 다시 열어도 유효한 세션이 자동으로 복원된다.
- 인증된 사용자가 자신의 `profiles` 행을 생성하거나 갱신할 수 있다.
- 브라우저에 service role key를 노출하지 않는다.

## 패키지

필요한 공식 패키지만 pnpm으로 추가한다.

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

다른 인증 또는 상태 관리 라이브러리는 추가하지 않는다.

## 환경 변수

현재 설정을 재사용한다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

- 값이 없으면 명확한 설정 오류를 발생시킨다.
- service role key를 클라이언트 환경 변수로 추가하지 않는다.
- `.env.local` 값은 커밋하지 않는다.

## Supabase 클라이언트

현재 FSD 구조에 맞춰 `src/shared/api/supabase` 아래에 필요한 클라이언트만 둔다.

예상 구조:

```text
src/shared/api/supabase/
├── client.ts
├── server.ts
└── database.types.ts
```

- 브라우저 컴포넌트는 browser client를 사용한다.
- Server Component, Server Action, Route Handler는 cookie 기반 server client를 사용한다.
- 이미 생성된 `Database` 타입을 client generic에 연결한다.
- Next.js 16의 최신 Supabase SSR 세션 갱신 방식을 공식 문서에서 확인하고 적용한다.

## 로그인 유지

사용자가 직접 로그아웃하기 전까지 로그인 상태가 자연스럽게 유지되는 경험을 기본값으로 제공한다.

- `@supabase/ssr`이 access token과 refresh token을 cookie에 저장하도록 한다.
- access token 만료 시 refresh token으로 세션을 자동 갱신하고 변경된 cookie를 응답에 반영한다.
- 브라우저 또는 설치된 PWA를 종료했다가 다시 실행해도 남아 있는 cookie에서 세션을 복원한다.
- 임의로 짧은 cookie `Max-Age` 또는 `Expires`를 설정하지 않는다.
- 별도의 `로그인 유지` 체크박스나 장기 세션용 custom token을 만들지 않는다.
- 보호 라우트 접근 권한은 cookie 존재 여부만 보지 않고 Supabase가 검증한 사용자 기준으로 판단한다.
- 세션을 갱신하거나 `Set-Cookie`를 반환하는 인증 응답은 공유 cache, ISR, CDN cache 대상에서 제외한다.
- 사용자가 로그아웃하거나 cookie를 삭제한 경우, refresh token이 폐기된 경우, 프로젝트의 inactivity/session timeout에 도달한 경우에는 다시 로그인하게 한다.

참고: [Supabase SSR Auth advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)

## 로그인

`/login`의 placeholder를 실제 로그인 화면으로 교체한다.

필수 입력:

- 이메일
- 비밀번호

동작:

- `signInWithPassword`를 사용한다.
- 성공하면 홈으로 이동한다.
- 실패하면 form 내부에 한국어 오류 메시지를 표시한다.
- 중복 제출을 방지한다.

## 회원가입

`/signup`의 placeholder를 실제 회원가입 화면으로 교체한다.

필수 입력:

- 표시 이름
- 이메일
- 비밀번호
- 비밀번호 확인

동작:

- 클라이언트와 서버에서 최소 입력 검증을 수행한다.
- `signUp` 성공 후 이메일 확인 필요 여부를 구분해 안내한다.
- 인증된 세션이 생긴 뒤 `profiles`에 `id`와 `display_name`을 upsert한다.
- 회원가입 중간 실패가 영구적인 성공 상태처럼 보이지 않게 한다.

## 로그아웃

- 기존 설정 화면 또는 인증된 공용 헤더 중 실제 사용되는 한 곳에만 로그아웃 동작을 둔다.
- `signOut` 성공 후 `/login`으로 이동한다.
- 별도의 전역 인증 store를 만들지 않는다.

## 라우트 보호

- `src/app`은 라우팅과 세션 경계만 담당한다.
- `(app)` layout에서 서버 기준으로 사용자를 확인한다.
- 비로그인 사용자는 `/login`으로 redirect한다.
- 로그인·회원가입 화면은 `_pages` 화면을 렌더링하는 얇은 entry point로 유지한다.
- cookie 갱신에 필요한 Next.js 진입 파일은 현재 Next.js 16 및 Supabase 공식 문서의 권장 방식을 따른다.

## UI

- 기존 Forest Green 디자인 토큰을 유지한다.
- 기존 shadcn/ui 컴포넌트를 먼저 재사용한다.
- 추가 컴포넌트가 필요하면 shadcn CLI로 필요한 것만 추가한다.
- 아이콘은 `lucide-react`에서 개별 import한다.
- 오류, 로딩, 키보드 포커스, label 등 접근성 기본 동작을 유지한다.
- 모바일 390px을 우선한다.

## 보안

- 인증 판단은 클라이언트 state가 아니라 서버에서 검증된 사용자 기준으로 한다.
- 사용자 입력으로 `owner_id`를 임의 지정하지 않는다.
- profile upsert의 `id`는 서버에서 확인한 `user.id`를 사용한다.
- Auth 오류 원문에 민감 정보가 포함되지 않도록 사용자 메시지를 정리한다.
- Supabase security advisor를 다시 확인한다.

## 제외 범위

이번 단계에서는 다음을 구현하지 않는다.

- `/records/new` 실제 저장
- People CRUD
- Place CRUD 및 장소 검색 API
- 소셜 로그인
- 비밀번호 재설정
- 이메일 템플릿 커스터마이징
- 관리자 권한
- Storage 및 사진
- 별도 인증 상태 관리 라이브러리

## 검증

- 회원가입 성공 및 이메일 확인 필요 상태
- 로그인 성공과 실패
- 브라우저 재실행 후 로그인 세션 복원
- 만료된 access token의 자동 갱신과 cookie 반영
- 로그아웃
- 보호 라우트 redirect
- 로그인 사용자의 auth 화면 redirect
- profile upsert가 다른 사용자 ID로 실행되지 않는지 확인
- lint
- TypeScript type check
- biome write
- production build

## 완료 후 정리

1. 추가한 Supabase client 파일
2. 사용한 환경 변수
3. 로그인·회원가입·로그아웃 흐름
4. 세션 갱신 방식
5. 보호한 라우트 범위
6. profile 생성 방식
7. security advisor 결과
8. 다음 `/records/new` 저장 연결에 필요한 작업
