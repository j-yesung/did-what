# DB 마이그레이션

## 기준 스키마

`migrations/20261006070951_baseline_schema.sql`은 2026-10-06까지 적용한 31개 마이그레이션을 합친 기준 스키마다. 테이블, 제약조건, 인덱스, 함수, 트리거, RLS와 권한을 포함한다.

- 새 Supabase 프로젝트는 기준 마이그레이션부터 순서대로 적용한다.
- 기존 연결 프로젝트는 기준 버전이 이미 적용된 것으로 이력을 정리했다. 기존 테이블 위에 기준 SQL을 직접 실행하지 않는다.
- 이후 변경은 `pnpm db:migration:new <이름>`으로 새 파일을 만들고 추가한다. 적용된 기준 파일은 수정하지 않는다.
- 기존 변경의 개별 SQL은 Git 이력에서 확인할 수 있다.

## 변경 적용

```sh
pnpm db:migration:list
pnpm db:push:dry-run --skip-vault
pnpm db:push --skip-vault
```

Vault 갱신이 필요하지 않은 스키마 변경에는 `--skip-vault`를 붙인다.

## 기존 데이터 보정

기존 기록·장소의 지역 정보 보정은 연결된 프로젝트에 이미 적용돼 있다. 과거 데이터를 별도로 가져올 때 필요한 보정 SQL은 통합 이전 Git 이력에서 확인한다.

처음 개발할 때 사용한 데이터 초기화와 폐기된 `people` 테이블의 변환 과정은 기준 스키마에 포함하지 않는다. 새 DB는 완성된 구조에서 시작한다.

## 다른 기존 환경의 이력 정리

다른 기존 DB가 과거 31개 파일을 적용한 상태라면, 이력 백업과 기준 스키마 비교를 먼저 수행한다. `supabase migration repair`로 이전 버전 이력을 정리하고 `20261006070951`을 적용된 상태로 표시한다. 이 명령은 마이그레이션 이력을 바꾸며 실제 테이블을 변경하지 않는다. 이미 정리된 연결 프로젝트에는 다시 실행할 필요가 없다.

공식 안내: [마이그레이션 관리](https://supabase.com/docs/guides/deployment/database-migrations), [이력 정리](https://supabase.com/docs/reference/cli/supabase-migration-repair).
