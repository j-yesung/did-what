# 여러 방문 지역·지도 인터랙션 후속 개선

- 검토일: 2026-09-22
- 갱신일: 2026-09-23
- 범위: #55(장소 중심 기록과 여러 방문 지역), #56(지도 인터랙션과 iOS 노치 영역) 리뷰에서 나온 버그 수정과 내부 구조 정리 중 남은 항목
- 원칙: 완료한 항목은 이 문서에서 삭제하고 Git 이력으로 남긴다. 한 커밋에는 한 항목만 담는다.

## 1. 기기에서 먼저 확인

### iOS 상태 표시줄 글자가 라이트 모드에서 안 보일 수 있다

- 위치: [app/layout.tsx](../app/layout.tsx)의 `appleWebApp.statusBarStyle`
- 현상: #56이 상태 표시줄 설정을 `black-translucent`로 바꿨다. 이 설정은 시계와 배터리를 배경과 상관없이 흰색으로 그린다. 라이트 모드 배경이 거의 흰색(`#f9fafb`)이라 홈 화면 앱에서 상단 글자가 안 보일 수 있다. 지도만이 아니라 모든 화면에 적용된다.
- 확인: 라이트 모드 아이폰의 홈 화면 앱에서 지도, 목록, 상세 화면의 상단을 본다. 설정이 반영되지 않으면 홈 화면에서 지웠다가 다시 추가한다.
- 조치: 글자가 안 보이면 두 가지 중 고른다. `default`로 되돌리면 노치 영역까지 지도를 채우는 효과는 포기해야 한다. 유지하려면 상단에 어두운 그라데이션을 깐다.

### 드로어 배경 흐림 효과의 성능

- 위치: [drawer.tsx](../src/shared/ui/drawer.tsx)의 `DrawerOverlay`
- 현상: #55에서 드로어 뒤 화면을 흐리게 하는 효과(`backdrop-blur-[2px]`)가 PR 목적과 무관하게 함께 들어갔다.
- 위험: 화면 전체를 덮는 배경을 흐리게 하면서 스와이프로 닫는 동안 투명도까지 매 프레임 바꾸면, 저사양 안드로이드와 iOS Safari에서 화면이 끊길 수 있다. 참고로 토스는 배경을 어둡게만 처리한다.
- 조치: 실제 기기에서 스와이프 중 끊김을 확인한다. 문제가 있으면 흐림 효과만 빼고 어둡게 처리는 유지한다.

## 2. 필요해질 때 할 것

### 액션 시트 공용 컴포넌트 분리

- 위치: [place-action-sheet.tsx](../src/pages/place/list/ui/place-action-sheet.tsx), [record-action-sheet.tsx](../src/pages/record/list/ui/record-action-sheet.tsx)
- 현상: 두 액션 시트는 드로어 구조, 헤더 스타일, 버튼 배치가 같다. 시트를 여는 목록의 상태 관리(`actionTarget`, `actionOpen`)도 같다.
- 조치: 세 번째 액션 시트가 생기면 `shared/ui/action-sheet.tsx`로 공통 구조를 빼고 제목·설명·버튼만 넘긴다.

### 지도 화면의 레이아웃 숫자

- 위치: [home-content.tsx](../src/pages/home/ui/home-content.tsx), [map-controls.tsx](../src/widgets/region-activity-map/ui/map-controls.tsx), [(map)/layout.tsx](../app/%28app%29/%28map%29/layout.tsx)
- 현상: 홈 지도의 위쪽 음수 여백 44px은 PageShell의 위 여백 24px과 간격 20px을 더한 값이다. 지도 조작 버튼의 56px은 툴바 위치에서 계산한 값이다. PageShell 여백이 바뀌면 둘 다 함께 어긋난다.
- 보류한 이유: 지도 레이아웃은 지역 목록 화면도 같이 쓴다. 레이아웃에서 여백을 끄면 지역 목록 화면까지 바뀌어서 단순히 끌 수 없다.
- 조치: PageShell 여백을 바꿀 때 이 두 숫자도 함께 고친다. 여러 번 어긋나면 `--toolbar-height` 옆에 CSS 변수로 모은다.

### DB 타입 파일을 다시 생성할 때

- 위치: [database.types.ts](../src/shared/api/supabase/database.types.ts)
- 확인 결과: 2026-09-23에 원격 스키마로 생성한 타입과 비교했다. 내용은 같고 테이블·함수 순서만 다르다.
- 주의: 기록 생성·수정 RPC 시그니처 다섯 곳의 `p_recorded_until`은 생성기가 `string`으로 만든다. 기록 생성·수정 액션이 null을 넘기므로 손으로 `string | null`로 고쳐 두었다.
- 조치: 다시 생성하면 이 다섯 곳을 `string | null`로 다시 고친다. 고치지 않으면 두 액션에서 타입 오류가 난다.

## 3. 코드 전체 규칙으로 따로 정할 것

### 링크 버튼 방식 통일

- 위치: [place-detail-content.tsx](../src/pages/place/detail/ui/place-detail-content.tsx), [place-action-sheet.tsx](../src/pages/place/list/ui/place-action-sheet.tsx)
- 현상: 장소 상세는 `PressLink`에 `buttonVariants` 클래스를 입히고, 장소 액션 시트는 `Button`의 `render`로 `PressLink`를 넣는다. 코드베이스 전체에도 두 방식이 섞여 있다.
- 조치: 한 방식으로 정하고 [convention.md](./convention.md)에 적는다.

### 아이콘의 `strokeWidth` 속성

- 위치: `PlusIcon`, `XIcon` 등 Phosphor 아이콘에 `strokeWidth={2}`를 넘기는 곳
- 현상: Phosphor 아이콘은 면으로 그려져 stroke를 지정하지 않으면 `strokeWidth`가 효과가 없어 보인다. #55 이전부터 있던 관행이다.
- 조치: 실제 효과를 확인하고, 없으면 새로 추가하지 않는다. 기존 코드를 정리하는 일은 별도 작업으로 한다.

## 적용 원칙

- 기기 확인 두 가지를 먼저 한다. 나머지는 해당 코드를 다시 고칠 때 함께 본다.
- 각 작업 전 현재 호출처를 다시 확인한다.
- 코드 변경 후 검증은 [검증 가이드](./verification.md)를 따른다.
- 항목이 모두 없어지면 문서를 삭제한다.
