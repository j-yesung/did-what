# Apple Design 관점 UI·인터랙션 검토

현재 UI는 디자인을 바꾸기보다 **입력에 대한 즉각적인 반응, 정확한 상태 표시, 취소·복귀 동작**을 다듬는 편이 효과가 크다. 지도와 타임라인, 절제된 색상, 관계를 강조하는 문구는 유지하는 것이 좋다.

apple-design 기준으로 로그인·구성원 설정부터 지도·지역·기록·장소·알림·설정과 공통 컴포넌트를 정적으로 검토했다. 실제 브라우저와 iPhone에서 재현한 결과는 아니므로, 키보드·스크롤·시각적 밀도에 관한 판단은 별도로 표시했다.

## 변경이 꼭 필요한 것 — 영향도순

### 1. 화면 끝 스크롤이 뒤로가기로 이어지는 동작

**현재 문제:** 상세·수정 화면에서 아래쪽 끝에 도달한 뒤 위로 180px 더 밀면 이전 화면으로 이동한다. 긴 내용을 끝까지 읽는 동작과 화면을 나가는 동작이 같은 축을 사용한다. 특히 수정 화면에서는 이탈 확인 후 ‘계속 작성’을 선택해도 훅의 `navigatingRef`와 화면 이동 효과를 초기화하는 경로가 없다.

**개선 이유:** 사용자는 내용을 더 보려다 화면을 벗어날 수 있고, 취소해도 원래 상호작용 상태로 완전히 돌아오지 않는다.

**권장 방법:** 우선 이 제스처를 제거하고 기존 뒤로가기 버튼을 유지하는 것을 권한다. 유지한다면 최소한 ‘이미 끝에 도달한 상태에서 시작한 별도 제스처’로 제한하고, 이탈 취소 시 변형·진행 표시·탐색 상태를 모두 복원해야 한다. 여기에 spring을 추가하는 것은 우선순위가 아니다.

**관련 파일:** `src/shared/lib/navigation/overscroll-back/use-overscroll-back.ts`, `src/shared/ui/overscroll-back.tsx`, `src/shared/ui/leave-guard.tsx`

### 2. 로딩·빈 상태·부분 실패를 구분하기

**현재 문제:** 기록 목록과 여러 상세 화면은 최초 로딩 때 `null`을 반환한다. 홈 지도는 데이터가 아직 없어도 ‘발자취가 없어요’를 표시할 수 있다. 기록 목록과 저장 장소는 기존 데이터가 있어도 `isError` 분기에서 목록 전체를 숨긴다. 기록 상세도 방문 장소만 실패했을 때 이미 확보한 본문까지 사라진다.

**개선 이유:** ‘조회 중’, ‘기록 없음’, ‘기록을 잃어버림’이 비슷하게 보인다. PWA의 느린 연결에서 특히 신뢰를 떨어뜨린다.

**권장 방법:** 최초 조회에는 기존 Spinner 또는 짧은 정적 skeleton을 표시하고, 성공적으로 빈 결과를 받았을 때만 empty 상태를 보여준다. 재조회·더 불러오기 실패는 기존 내용을 유지하면서 해당 영역에 오류를 표시하는 편이 좋다. skeleton shimmer는 필요하지 않다.

**관련 파일:** `src/pages/home/ui/home-content.tsx`, `src/pages/record/list/ui/record-list.tsx`, `src/pages/place/list/ui/saved-place-list.tsx`, `src/pages/record/detail/ui/record-detail-content.tsx`, `src/pages/place/detail/ui/place-detail-content.tsx`

### 3. 오류를 읽은 뒤 실제로 복구할 수 있게 하기

**현재 문제:** 공통 조회 오류는 ‘잠시 후 다시 시도해 주세요’라고 하지만 재시도 버튼이 없다. 기록 작성의 장소 선택지 조회가 실패하면 다음 버튼도 비활성화된다. 로그인·회원가입은 서버가 반환한 오류는 표시하지만, 요청 자체가 예외로 실패한 `submit.isError`는 화면에 표시하지 않는다.

**개선 이유:** 무엇을 해야 하는지 알 수 없거나, 입력한 상태를 유지한 채 복구할 방법이 없다.

**권장 방법:** 조회 오류에 해당 쿼리의 ‘다시 시도’를 연결하고, 인증 폼에는 네트워크 실패 안내를 추가한다. 입력과 현재 단계를 보존하는 것이 우선이다. 존재하지 않는 기록에는 재시도보다 목록으로 돌아가는 행동이 적절하다.

**관련 파일:** `src/shared/ui/load-error-alert.tsx`, `src/widgets/record-form/funnel/create-record-funnel.tsx`, `src/pages/auth/ui/auth-form.tsx`

### 4. 성공 피드백과 실제 완료 시점을 맞추기

**현재 문제:** 알림 스위치는 권한 요청·구독 저장이 끝나기 전에 성공 Notice를 띄운다. 이후 권한이 거절되면 성공 뒤에 실패가 나온다. 공통 저장·삭제는 성공 Notice를 띄운 뒤 관련 쿼리 재조회를 모두 기다리고 화면을 이동한다.

**개선 이유:** ‘완료됐는데 계속 기다림’, ‘성공했다고 했는데 실패함’은 애니메이션보다 큰 UX 불일치다.

**권장 방법:** 스위치 자체는 즉시 반응하되 성공 안내는 확정된 결과에만 연결한다. 저장·삭제는 필요한 캐시를 갱신한 뒤 이동하고, 나머지 재조회는 화면 이동을 막지 않도록 분리하는 것이 좋다. 서버에서 확정되기 전 삭제 성공을 표시하라는 의미는 아니다.

**관련 파일:** `src/features/push-notification/model/use-push-toggle.ts`, `src/shared/lib/server-action/use-action-mutation.ts`, `src/pages/notification/ui/notification-list.tsx`

### 5. reduced-motion의 남은 누락 보완

**현재 문제:** 화면 전환·Spinner·일반 버튼에는 대응이 있지만 다음에는 이동이 남는다.

- Notice는 시간만 줄이고 zoom 효과는 유지한다. 아이콘도 조건 없이 `startAnimation()`을 호출한다.
- SegmentedControl은 선택 표시의 이동만 끄고 항목 자체의 press scale은 유지한다.
- 장소 검색 결과의 press scale, Switch의 thumb 이동에는 별도 대응이 없다.
- 공통 Dialog도 zoom 대응이 없지만, 현재 화면에서 사용하는 호출부는 찾지 못했다.

**개선 이유:** 같은 설정을 켰는데 컴포넌트마다 반응이 다르다.

**권장 방법:** 이동·확대는 즉시 상태 전환이나 짧은 opacity 변화로 대체하고, 색·체크 표시·문구는 유지한다. Notice 아이콘은 정적으로 표시하는 것이 적절하다. 미사용 Dialog는 실제 사용 컴포넌트보다 후순위다.

**관련 파일:** `src/shared/ui/notice-provider.tsx`, `src/shared/ui/segmented-control.tsx`, `src/shared/ui/switch.tsx`, `src/pages/place/list/ui/place-search-results.tsx`, `src/shared/ui/dialog.tsx`

### 6. 작은 터치 대상과 시트의 명시적 닫기

**현재 문제:** `IconButton sm`은 28px이고 방문 장소 제거와 Notice 닫기에 사용된다. 공통 작은 버튼도 높이가 32px이다. 지역·장소 검색 시트에는 화면 안의 명시적인 닫기 버튼이 없다.

**개선 이유:** 엄지 조작의 정확도가 떨어지고, 검색 결과를 고르지 않고 빠져나오는 방법이 제스처나 바깥 영역 탭에 의존한다.

**권장 방법:** 작은 아이콘의 모양은 유지해도 터치 영역은 약 44×44 CSS px를 목표로 확보한다. 촘촘한 목록에서는 확장 영역이 이웃 버튼과 겹치지 않아야 한다. 검색 시트 헤더에는 이름이 있는 닫기 버튼을 제공하고 기존 제스처도 유지한다.

**관련 파일:** `src/shared/ui/icon-button.tsx`, `src/shared/ui/button.tsx`, `src/features/record/select-record-location/ui/record-location-fields.tsx`, `src/features/record/select-record-location/ui/region-search-content.tsx`, `src/features/record/select-record-location/ui/place-picker-panel.tsx`

### 7. 목록 추가·삭제 후 포커스와 결과 안내

**현재 문제:** 방문 장소 제거와 구성원 삭제는 누른 버튼을 DOM에서 바로 없애지만 다음 포커스를 지정하지 않는다. 구성원 추가도 새 입력으로 이동하지 않는다.

**개선 이유:** 키보드와 VoiceOver 사용자는 방금 바뀐 위치와 다음 행동을 놓칠 수 있다.

**권장 방법:** 제거 후 다음 항목, 마지막 항목이면 이전 항목이나 추가 버튼으로 포커스를 보낸다. 구성원 추가는 새 이름 입력으로 연결하고, 장소 추가·제거는 짧은 상태 안내를 제공하면 된다. 이 문제 해결에 목록 애니메이션은 필요하지 않다.

**관련 파일:** `src/features/record/select-record-location/ui/record-location-fields.tsx`, `src/features/member/setup-members/ui/member-setup-form.tsx`

## 있으면 좋은 것 — 영향도순

### 8. iOS 키보드와 복귀 스크롤 검증

**현재 우려:** 작성 화면은 `h-dvh` 안에 본문 스크롤과 하단 버튼을 배치한다. 검색 시트에는 VirtualKeyboardProvider가 있지만 검색란과 결과 목록의 스크롤 구조가 나뉘어 있다. 상세 스크롤 복원은 최초 layout 시점 한 번뿐이라 비동기 콘텐츠가 나중에 늘어나면 저장 위치에 도달하지 못할 수 있다.

**개선 이유:** 입력·검색·기록 수정 후 돌아오기처럼 핵심 흐름에서 위치를 잃을 가능성이 있다. **가림이나 점프가 실제 발생하는지는 기기 검증이 필요하다.**

**권장 방법:** 작은 iPhone의 PWA에서 키보드 열린 상태의 마지막 입력·검색 결과·완료 버튼을 확인한다. 문제를 재현한 영역만 viewport 대응을 보완하고, 스크롤 복원은 필요한 콘텐츠가 준비됐을 때 재시도하되 사용자가 이미 스크롤했다면 덮어쓰지 않는 방식이 좋다. Base UI도 안정된 헤더·푸터와 스크롤 본문 구성을 안내한다.

**관련 파일:** `src/pages/record/new/index.tsx`, `src/widgets/record-form/funnel/funnel-layout.tsx`, `src/shared/ui/drawer.tsx`, `src/shared/lib/navigation/use-scroll-restoration.ts`

**참고:** [Base UI Drawer — Virtual keyboard aware](https://base-ui.com/react/components/drawer#virtual-keyboard-aware)

### 9. 일상적인 성공 Notice의 시각적 비중 낮추기

**현재 문제:** 성공·경고·오류가 모두 화면 중앙의 큰 표면과 애니메이션 아이콘을 사용한다. 모달처럼 보이지만 배경 조작은 가능하고, 바깥을 누르면 사라진다. 포커스·읽기 중 자동 닫힘을 멈추는 처리도 없다.

**개선 이유:** 장소 저장이나 설정 변경이 기록 본문보다 더 강하게 주의를 끈다.

**권장 방법:** 일상적인 성공은 하단 내비게이션과 겹치지 않는 작은 알림이나 해당 컨트롤의 상태 변화로 충분하다. 수정이 필요한 오류는 필드 가까이에 남긴다. 자동 닫히는 메시지 안에 조작 요소가 있다면 포커스 중에는 유지하는 편이 좋다.

**관련 파일:** `src/shared/ui/notice-provider.tsx`

### 10. press feedback을 면적과 역할에 맞게 정리

**현재 문제:** 일반 Button과 ListRow는 누를 때 200ms·0.96배, TextButton 계열은 80ms·0.97배다. 하단 탭은 축소와 표면 효과를 모두 꺼서 경로가 바뀌기 전 반응이 약하다. 큰 기록 항목도 일반 버튼처럼 4% 줄어든다.

**개선 이유:** 작은 버튼과 넓은 텍스트 행의 물리적 반응이 비슷하고, 자주 쓰는 탐색 요소 간 반응 속도가 다르다.

**권장 방법:** 작은 버튼은 즉시 표면 변화와 80–100ms 정도의 얕은 축소, 넓은 행은 표면 변화 중심을 권한다. 하단 탭에는 눌린 동안의 작은 색 변화면 충분하다. hover는 마우스 환경에만 적용하고, 기존 focus ring을 유지한다. 현재 정렬 링크에는 선택 전 press 표현도 보완할 여지가 있다.

**관련 파일:** `src/shared/ui/button.tsx`, `src/shared/ui/list-row.tsx`, `src/shared/lib/interaction.ts`, `src/widgets/bottom-navigation.tsx`, `src/pages/record/list/ui/record-filter-form.tsx`

### 11. 확인창 이동량을 줄이고 시트 속도는 실측 후 조정

**현재 문제:** ConfirmDialog는 100px 아래에서 300ms 동안 나타나고, 닫힐 때는 100ms fade만 사용한다. 작은 확인 작업치고 이동량이 크다. Drawer는 450ms 전환을 사용하지만 드래그 중에는 시간을 0으로 만들고 해제 강도도 반영하고 있다.

**개선 이유:** 확인창은 중요한 문장을 빨리 읽게 해야 한다. 반면 시트는 코드에 CSS transition이 있다는 이유만으로 잘못된 제스처라고 판단하면 안 된다.

**권장 방법:** 확인창은 짧은 fade 또는 작은 이동으로 줄이고 등장·퇴장의 표현을 맞춘다. Drawer는 빠른 열기→닫기→재잡기를 실제로 시험한 뒤, 느리게 느껴지면 300–350ms부터 비교한다. spring 도입은 중단·반전의 불연속이 확인될 때만 고려한다.

**관련 파일:** `src/shared/ui/confirm-dialog.tsx`, `src/shared/ui/drawer.tsx`

## 변경하지 않는 것이 좋은 것

| 대상 | 현재 평가·유지 이유 | 권장 방향 | 관련 파일 |
| --- | --- | --- | --- |
| 색상·폰트·지도·타임라인 | 시맨틱 색상과 Pretendard, 발자취 지도가 서비스 정체성을 만든다. Apple 외형을 복제할 이유가 없다. | 현재 체계를 유지하고 읽기 어려운 부분만 조정 | `src/app/styles/globals.css`, `src/widgets/region-activity-map.tsx`, `src/entities/record/ui/record-card.tsx` |
| 탭 전환과 작성 단계의 짧은 모션 | 탭은 160ms fade, 작성 단계는 방향을 구분한 16px 이동이다. 뒤로가기에서는 등장 효과를 생략한다. | 전 화면 slide·공유 요소 전환을 추가하지 않기 | `src/shared/ui/layouts/page-shell.tsx`, `src/widgets/record-form/funnel/funnel-layout.tsx` |
| 날짜 선택의 초안→적용, 삭제·이탈 확인 | 날짜를 고르다 취소해도 확정 값이 유지되고, 기록 삭제는 되돌릴 수 없음을 설명한다. 사용자 통제권에 도움이 된다. | 동작은 유지하고 닫기·오류·포커스만 보완 | `src/widgets/record-form/field/date-field.tsx`, `src/features/record/delete-record/ui/delete-record-button.tsx` |
| 정적인 지도와 목록, 단순한 표면 | 읽고 회상하는 콘텐츠에 불필요한 움직임이 없다. 현재 불투명 표면도 충분한 구분을 제공한다. | 셀 순차 등장, 목록 stagger, 반복 bounce, 전면 blur, 상시 햅틱·소리 추가하지 않기 | `src/widgets/region-activity-map.tsx`, `src/entities/record/ui/record-timeline.tsx`, `src/shared/ui/card.tsx` |

첫 개선 범위로는 **1–5번**을 권한다. 새로운 시각 효과 없이도 잘못된 이탈, 기다림, 상태 혼동을 줄여 iOS/PWA의 체감 완성도를 높일 수 있다.
