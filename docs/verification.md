# 검증 실행 기준

검증은 변경 영향도에 비례해 고른다. 매번 전부 돌리지 않는다.

| 검증 | 명령 | 대략 소요 |
| --- | --- | --- |
| 포맷·import 정렬 | `pnpm exec biome check --write src app` | 0.05초 |
| 타입 | `pnpm exec tsc --noEmit` | 수 초 |
| 테스트 | `pnpm test` | 0.2초 |
| 빌드 | `pnpm build` | 수십 초 |

## 변경 유형별

- 문서·주석·텍스트만 수정 → 생략
- 코드 파일을 만들거나 고쳤으면 → biome. 사실상 공짜라 기본값으로 돌린다
- 타입·prop·import/export 변경 → typecheck
- `*.test.mjs`가 붙은 모듈(순수 함수) 변경 → test
- 단일 컴포넌트의 클래스나 문구만 손봤다면 → biome까지만. 주변 코드 검토를 우선한다

## build가 필요한 경우

빌드는 느려서 아래에 해당할 때만 돌린다.

- **라우트 파일 추가·삭제**: `.next/types/validator.ts`가 낡은 채로 남아 typecheck가 없는 모듈을 찾는 유령 오류를 낸다. 재빌드로만 풀린다
- **Tailwind 클래스·`globals.css` 변경**: 의도한 CSS가 실제로 생성됐는지는 `.next/static/chunks/*.css`에서만 확인된다. 특히 임의 값(`after:-inset-x-1`)이나 커스텀 variant는 오타여도 타입체크를 통과한다
- **metadata·manifest·viewport 변경**: 출력되는 `<link>`, `<meta>`는 빌드 후 서버를 띄워야 보인다
- **서버/클라이언트 경계 변경**: `"use client"` 추가·제거, `next/headers`를 끌어오는 import는 typecheck를 통과해도 빌드에서 깨진다
- 커밋 직전 마지막 확인

## 커밋 전

- typecheck·biome·test를 한 번 돌린다
- 커밋을 여러 개로 나눌 때는 중간 커밋도 검증한다. 부분 스테이징으로 나눈 커밋은 그 시점 트리가 깨져 있기 쉽다

```bash
git worktree add /tmp/wt <중간커밋>
ln -s "$(pwd)/node_modules" /tmp/wt/node_modules
(cd /tmp/wt && node_modules/.bin/tsc --noEmit)
git worktree remove --force /tmp/wt
```
