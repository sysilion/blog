---
title: "Tailwind 는 정의되지 않은 클래스를 경고 없이 버린다"
date: 2026-10-31T00:49:36+09:00
draft: false
tags: ["tailwindcss", "css", "frontend"]
summary: "animate-in, no-scrollbar 를 몇 달 동안 쓰고 있었는데 CSS 는 한 줄도 생성되지 않았다."
---

## 무슨 일이

dealsignal 프론트엔드 디자인을 손보다가 필터 패널의 `animate-in fade-in slide-in-from-top-4`,
가로 스크롤 줄의 `no-scrollbar`, 목록의 `custom-scrollbar` 가 아무 효과도 없다는 걸 알았다.
빌드도 린트도 조용했다. 화면에서는 애니메이션이 원래 없는 것처럼 보였고 스크롤바도 그대로 나왔다.

## 원인

`animate-in` 계열은 `tailwindcss-animate`(v4 에서는 `tw-animate-css`) 플러그인이 만드는 클래스다.
이 프로젝트에는 그 플러그인이 없다. `no-scrollbar` 도 직접 `@utility` 로 정의해야 생기는 이름이다.

[[tailwind-css]] 는 소스에서 클래스 후보를 긁어 와서 아는 이름만 CSS 로 만든다. 모르는 이름은 후보에서 빠질 뿐이고
에러나 경고는 내지 않는다. 다른 프로젝트에서 복사해 온 클래스가 그대로 죽은 글자가 된다.

## 재현

```js
// frontend/ 에서 실행 (tailwindcss 4.3.3)
import { compile } from '@tailwindcss/node'
const c = await compile('@import "tailwindcss";', { base: process.cwd(), onDependency() {} })
const css = c.build(['animate-in', 'fade-in', 'no-scrollbar', 'animate-spin'])
for (const k of ['animate-in', 'fade-in', 'no-scrollbar', 'animate-spin'])
  console.log(k, css.includes('.' + k) ? 'generated' : 'NOT generated')
// animate-in NOT generated
// fade-in NOT generated
// no-scrollbar NOT generated
// animate-spin generated
```

## 그래서

`index.css` 에 `@utility no-scrollbar`, `@utility thin-scrollbar` 를 정의하고,
애니메이션은 `@theme` 의 `--animate-fade-in`, `--animate-slide-up` 으로 직접 만들어 `animate-fade-in` 처럼 쓰게 바꿨다.

## 한 줄

남의 코드에서 가져온 Tailwind 클래스가 안 먹으면 먼저 위 스크립트로 그 이름이 생성되는지 확인한다. 안 나오면 플러그인을 넣거나 `@utility` 로 정의한다.
