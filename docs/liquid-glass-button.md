Next.js + React 프로젝트에 재사용 가능한 `LiquidGlassButton` 컴포넌트를 구현해줘.

목표는 Apple의 Liquid Glass에서 영감을 받은 버튼이며, 단순한 glassmorphism이 아니라 유리의 깊이감, 반사광, 포인터 반응, 눌림 효과까지 포함해야 한다.

기술 스택:

* React
* Next.js App Router
* TypeScript
* 최신 Tailwind CSS
* CSS Module 사용하지 말 것
* styled-components 사용하지 말 것
* 가능하면 별도의 WebGL / Three.js 라이브러리도 사용하지 말 것

컴포넌트 이름:

```tsx
LiquidGlassButton
```

기본 사용 예:

```tsx
<LiquidGlassButton onClick={() => console.log("clicked")}>
  시작하기
</LiquidGlassButton>
```

컴포넌트는 실제 `<button>` 요소를 사용하고 아래 타입을 기반으로 만들어줘.

```tsx
type LiquidGlassButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;
```

`children`, `className`, `disabled`, `onClick`, `type`, `aria-*` 등 기본 button props를 그대로 받을 수 있어야 한다.

디자인 방향:

* pill 형태
* 투명하고 맑은 유리 재질
* Apple Liquid Glass처럼 frosted glass보다 투명도가 높을 것
* blur는 낮게 유지
* saturation / brightness를 약간 높일 것
* 상단에는 specular highlight
* 테두리에는 밝은 glass rim
* 하단에는 아주 약한 inner shadow
* 마우스를 따라 움직이는 caustic / light reflection
* 버튼 내부에 약한 lens/refraction illusion
* hover 시 약한 3D tilt
* active 시 눌리면서 glass가 살짝 압축되는 느낌
* neon, 과도한 glow, cyberpunk 스타일은 피할 것

버튼 기본 크기:

```txt
height: 54px
min-width: 148px
padding-inline: 24px
border-radius: 999px
font-size: 16px
font-weight: 600
```

Tailwind 기준으로는 가능한 한 아래와 비슷한 형태로 작성해줘.

```tsx
className="
  relative
  isolate
  inline-flex
  h-[54px]
  min-w-[148px]
  items-center
  justify-center
  overflow-hidden
  rounded-full
  px-6
  text-base
  font-semibold
"
```

동적 인터랙션은 CSS custom properties를 사용해줘.

```txt
--pointer-x
--pointer-y
--rotate-x
--rotate-y
--shift-x
--shift-y
```

`useRef<HTMLButtonElement>`를 사용하고 `pointermove`에서 `getBoundingClientRect()`를 이용해 현재 포인터 위치를 계산해줘.

예:

```tsx
element.style.setProperty("--pointer-x", `${x}px`);
element.style.setProperty("--pointer-y", `${y}px`);
element.style.setProperty("--rotate-x", `${rotateX}deg`);
element.style.setProperty("--rotate-y", `${rotateY}deg`);
```

pointer 위치는 중앙 기준으로 normalize해서 tilt 값을 계산해줘.

예:

```tsx
const normalizedX = x / rect.width - 0.5;
const normalizedY = y / rect.height - 0.5;
```

회전 강도는 과하지 않게 유지해줘.

대략:

```txt
rotateX: 최대 ±3~5deg
rotateY: 최대 ±5~7deg
```

pointerleave 시 모든 transform 관련 CSS variable을 원래 값으로 되돌려줘.

버튼 내부 레이어는 아래처럼 구성해줘.

```tsx
<button>
  <span data-layer="refraction" />
  <span data-layer="caustic" />
  <span data-layer="highlight" />
  <span data-layer="content">
    {children}
  </span>
</button>
```

각 레이어 역할:

`refraction`

* pointer 위치 기반 radial gradient
* pointer 방향으로 약간 translate
* scale을 살짝 키워서 lens distortion처럼 보이게
* blur / saturation 사용 가능
* 실제 WebGL refraction은 아니지만 optical illusion을 만들 것

`caustic`

* pointer 위치에 따라 이동하는 밝은 reflection
* radial-gradient와 linear-gradient 조합
* 필요한 경우 `mix-blend-screen` 사용
* 너무 밝지 않게 제한

`highlight`

* 버튼 상단과 외곽의 specular reflection
* glass rim과 두께감 표현

`content`

* 항상 가장 위에 위치
* pointer-events-none
* 텍스트 가독성 유지

Tailwind arbitrary value를 적극 활용해도 된다.

예:

```tsx
backdrop-blur-[5px]
backdrop-saturate-[1.45]
backdrop-brightness-[1.08]
```

필요하면 다음처럼 arbitrary backdrop filter 전체 표현도 사용할 수 있다.

```tsx
[backdrop-filter:blur(5px)_saturate(145%)_brightness(1.08)]
[-webkit-backdrop-filter:blur(5px)_saturate(145%)_brightness(1.08)]
```

배경은 대략 다음과 같은 반투명 gradient를 사용할 것.

```css
linear-gradient(
  180deg,
  rgba(255,255,255,0.18),
  rgba(255,255,255,0.08) 45%,
  rgba(255,255,255,0.05)
)
```

Tailwind arbitrary background syntax을 사용해도 된다.

예:

```tsx
bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.085)_45%,rgba(255,255,255,0.06)_100%)]
```

box-shadow도 Tailwind arbitrary value로 처리해줘.

예시 방향:

```css
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.65),
  inset 0 -1px 1px rgba(0,0,0,.1),
  0 8px 30px rgba(0,0,0,.14);
```

단, 그림자가 너무 과하지 않게 조절할 것.

transform은 CSS 변수와 Tailwind arbitrary property를 조합해줘.

예:

```tsx
[transform:perspective(600px)_rotateX(var(--rotate-x))_rotateY(var(--rotate-y))]
```

hover에서는 약간의 scale 또는 shadow 증가만 적용.

active에서는:

```txt
scale 약 0.97
```

정도로 눌리는 느낌을 만들어줘.

포인터 위치에 따른 radial gradient도 Tailwind arbitrary property로 작성 가능하다.

예:

```tsx
bg-[radial-gradient(90px_circle_at_var(--pointer-x)_var(--pointer-y),rgba(255,255,255,0.28),transparent_70%)]
```

필요하다면 inline `style`은 CSS custom property 초기값을 정의하는 용도로만 최소한 사용해도 된다.

예:

```tsx
style={{
  "--pointer-x": "50%",
  "--pointer-y": "50%",
  "--rotate-x": "0deg",
  "--rotate-y": "0deg",
} as React.CSSProperties}
```

가능하면 문자열 class 조합은 기존 프로젝트에 `cn()` 유틸이 있다면 사용해줘.

예:

```tsx
className={cn(
  "...",
  className,
)}
```

프로젝트에 `cn()`이 없다면 새 라이브러리를 추가하지 말고 단순 template literal을 사용해도 된다.

접근성도 반드시 구현할 것.

* `focus-visible`
* `disabled`
* keyboard interaction
* `prefers-reduced-motion`

Tailwind의 motion-safe / motion-reduce variant를 사용해도 된다.

예:

```tsx
motion-reduce:transition-none
motion-reduce:transform-none
```

WebGL은 이번 구현에서 사용하지 말 것.

즉 다음은 사용하지 않는다.

* Three.js
* React Three Fiber
* canvas
* WebGL
* fragment shader

이번 구현의 목표는 실제 DOM 버튼으로 사용할 수 있는 고품질 Apple-like Liquid Glass UI다.

파일은 하나로 구현하는 것을 우선으로 해줘.

```txt
liquid-glass-button.tsx
```

별도 CSS 파일은 만들지 말 것.

Tailwind arbitrary values와 CSS custom properties만으로 구현해줘.

추가로 테스트용 페이지를 만들어줘.

```txt
page.tsx
```

테스트 페이지 배경은 버튼의 transparency와 glass effect가 잘 드러나도록 아래 계열의 gradient를 사용해줘.

```css
radial-gradient(circle at 22% 35%, #ff506c, transparent 30%),
radial-gradient(circle at 72% 65%, #178cff, transparent 31%),
radial-gradient(circle at 50% 15%, #986cff, transparent 27%),
#10131c
```

최종 결과물:

```txt
liquid-glass-button.tsx
page.tsx
```

각 파일의 전체 코드를 출력하고, 마지막에 `refraction`, `caustic`, `highlight`, `content` 레이어 역할만 짧게 설명해줘.

기존 프로젝트 구조와 Tailwind 설정을 먼저 확인하고, 현재 코드베이스의 conventions를 따를 것.
