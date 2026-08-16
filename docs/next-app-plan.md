# 다음 단계: 하단 탭 즉시 전환

> 상태: 완료 (2026-08-16)

## 배경

하단 탭 다섯 개에 `prefetch={true}`를 붙였는데도 탭을 누를 때마다 `?_rsc=` 요청이 다시 나갔다.

원인은 Next.js의 `staleTimes.dynamic` 기본값이 0이라는 점이다. 이 앱의 화면은 인증과 Supabase 조회가 필요한 동적 라우트라, 미리 받아 둔 페이로드를 클라이언트 라우터 캐시가 도착 즉시 버렸다. 프리페치는 정상 동작하고 있었고 그 결과를 쓰지 못하는 상태였다. 매 진입마다 버려진 프리페치를 다시 받으므로 서버 요청은 오히려 늘어나 있었다.

인증 비용도 겹쳤다. 화면 하나를 그리는 데 인증을 세 번 세우고 그중 페이지 단계의 `getUser()`가 Auth 서버 왕복이었다. 여기에 프리페치 네 건이 곱해져 탭 화면 진입 한 번에 왕복이 다섯 번 발생했다.

메인 화면 데이터를 클라이언트 TanStack Query로 옮기는 방안은 택하지 않는다. 페이지 껍데기가 여전히 동적 RSC라 서버 왕복은 그대로 남고 그 위에 클라이언트 조회가 한 단계 더 얹혀 첫 방문이 더 느려진다. 조회 엔드포인트를 새로 열어야 해서 RLS 노출면도 늘어난다. 데이터 계층은 그대로 두고 라우터 캐시 수명과 인증 비용만 고친다.

## 구현

1. `next.config.ts`에 `experimental.staleTimes = { dynamic: 300 }`을 지정해 동적 라우트 페이로드를 300초 동안 재사용한다.
2. `requireUser()`의 `getUser()`를 `getClaims()`로 바꾼다. 프로젝트가 비대칭 키(ES256)를 쓰므로 서명을 WebCrypto로 로컬 검증하고 Auth 서버를 다녀오지 않는다. JWKS는 프로세스당 한 번만 받는다.
3. `requireUser()`를 React `cache()`로 감싸 layout과 page가 각각 불러도 요청당 한 번만 검증한다.
4. `app/(app)/layout.tsx`가 직접 만들던 클라이언트와 `getClaims()` 호출을 `requireUser()`로 통일한다. 새 화면이 인증을 빠뜨려도 layout에서 막힌다.
5. 하단 내비게이션의 다섯 `Link`에 `prefetch={true}`를 지정한다.
6. 다섯 메인 화면의 `PageShell`이 렌더링될 때만 콘텐츠 진입 모션을 적용한다. 160ms 동안 `opacity 0 → 1`, `translateY 6px → 0`, `scale 0.99 → 1`로 전환하고, 하단 내비게이션은 상위 layout에 남겨 고정한다.
7. `prefers-reduced-motion`에서는 진입 모션을 적용하지 않는다.
8. 프리페치가 끝나기 전에 누른 전환에서는 기존 `loading.tsx`가 300ms 뒤 Spinner를 표시한다.

## 캐시 수명을 300초로 잡은 근거

화면 데이터는 본인의 뮤테이션으로만 바뀌고, 모든 서버 액션이 관련 경로를 `revalidatePath`로 무효화한다.

| 액션 | 무효화 경로 |
| --- | --- |
| 기록 생성·수정·삭제 | `/`, `/records`, `/places`, `/records/{id}` |
| 사람 생성·수정·삭제 | `/people`, `/records`, `/records/new`, `/people/{id}` |
| 장소 저장·수정·삭제 | `/places`, `/records`, `/records/new`, `/places/{id}` |

서버 액션이 무효화를 수행하면 응답의 `x-action-revalidated` 헤더를 보고 클라이언트 라우터 캐시도 함께 비운다. 따라서 본인 조작으로 낡은 화면이 남는 경로는 없다.

남는 지연은 다른 기기에서 고친 내용이 이 기기에 최대 300초 늦게 보이는 것뿐이다. 개인 기록 앱이라 다중 기기 동시 사용이 드물고, 새로고침이나 앱 재진입이면 즉시 갱신된다.

`static`은 지정하지 않는다. 값이 없으면 Next.js가 기본값 300초를 그대로 쓴다.

## 동작 기준

- 프로덕션에서 앱에 진입하면 현재 화면을 제외한 나머지 탭의 전체 라우트를 백그라운드에서 준비한다.
- 준비가 끝난 탭은 `?_rsc=` 요청 없이 콘텐츠 진입 모션과 함께 즉시 표시된다.
- 화면을 그리는 동안 Auth 서버 왕복이 발생하지 않는다. 토큰 검증은 로컬 서명 확인으로 끝난다.
- 프리페치가 늦어 Spinner가 먼저 표시되어도 실제 콘텐츠가 렌더링되는 시점에 진입 모션을 시작한다.
- 기록·사람·장소를 변경하면 관련 탭이 다음 진입에서 최신 결과를 보여준다.
- 마지막 준비 시점에서 300초가 지나면 다음 전환에서 한 번 다시 받아온다.
- 새로고침이나 앱 프로세스 재시작 후에는 라우터 캐시가 초기화되어 다시 프리페치한다.

## 범위 제외

- 메인 화면 데이터를 TanStack Query로 이전
- `cacheComponents`와 `"use cache"` 기반 부분 프리렌더링. 개인 데이터라 사용자별 캐시 키 설계가 필요해 이번 범위에서 제외한다
- 영속 캐시와 오프라인 데이터 저장
- keep-alive와 React `Activity`
- 상세·작성·수정 화면의 좌우 push 모션
- 실험적인 Next.js `viewTransition`
- 전역 상태 기반 라우트 로딩 관리

## 완료 조건

- 프로덕션에서 하단 탭 링크가 전체 RSC와 데이터를 미리 요청한다.
- 프리페치가 끝난 탭을 누르면 새 `?_rsc=` 요청 없이 전환된다.
- 하단 내비게이션은 고정되고 콘텐츠만 160ms 동안 움직인다.
- 상세·작성·수정 화면에는 탭 진입 모션이 적용되지 않는다.
- 모션 축소 환경에서는 애니메이션이 제거된다.
- 데이터 변경 후 관련 탭에서 최신 결과가 보인다.

## 검증

프리페치는 프로덕션 빌드에서만 전체 라우트를 준비한다. `pnpm dev`로는 재현되지 않는다.

1. `pnpm build && pnpm start`로 실행하고 로그인한다.
2. 개발자 도구 Network에서 탭을 누르기 전에 나머지 네 경로의 RSC 요청이 발생하는지 확인한다.
3. 그 요청들이 끝난 뒤 탭을 눌러 새 `?_rsc=` 요청 없이 콘텐츠 모션이 시작되는지 확인한다.
4. 네트워크 속도를 낮춰 프리페치가 끝나기 전에 탭을 누르면 공통 로딩 화면이 동작하는지 확인한다.
5. 운영체제의 모션 줄이기를 켜고 전환 애니메이션이 제거되는지 확인한다.
6. 기록·사람·장소를 변경한 뒤 관련 탭이 최신 결과를 표시하는지 확인한다.

## 참고

- [Next.js Link](https://nextjs.org/docs/app/api-reference/components/link)
- [Next.js Prefetching](https://nextjs.org/docs/app/guides/prefetching)
- [Next.js staleTimes](https://nextjs.org/docs/app/api-reference/config/next-config-js/staleTimes)
- [Next.js loading.js](https://nextjs.org/docs/app/api-reference/file-conventions/loading)
- [Supabase getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims)
