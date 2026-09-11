---
title: "hidden 속성은 display 를 지정한 CSS 규칙에 진다"
date: 2026-09-12T03:25:00+09:00
draft: false
tags: ["css", "html"]
summary: "el.hidden = true 를 했는데도 요소가 남는다면 작성자 스타일의 display 가 기본 스타일시트를 덮은 것이다"
---

게임 프로토타입에서 타이틀 화면이 사라지지 않았다. 숨기는 코드는 정확히 불리고 있었다.

```js
hide() { this.root.hidden = true; }
```

## 원인

`hidden` 속성 자체에는 힘이 없다. 브라우저 **기본 스타일시트**에 들어 있는 한 줄이 일을 한다.

```css
[hidden] { display: none }
```

기본 스타일시트는 [[css-cascade-origin|캐스케이드 origin]]에서 작성자 스타일보다 우선순위가 낮다.
그래서 내 CSS 에 `display` 를 지정한 규칙이 하나라도 걸리면 그쪽이 이긴다.

```css
.screen { position: absolute; inset: 0; display: flex; }
```

요소는 `hidden` 을 단 채로 계속 `display: flex` 로 그려진다. 개발자 도구에서 보면 속성은 붙어 있는데 화면에는 보이는, 헷갈리는 상태가 된다.

## 재현

```html
<style>
  .box { display: flex; }
</style>
<div class="box" hidden>보인다</div>
```

```js
// happy-dom / 브라우저 모두
getComputedStyle(document.querySelector('.box')).display  // "flex"
```

## 그래서

문서 전체에 한 줄을 건다.

```css
[hidden] { display: none !important; }
```

`!important` 가 필요하다. 특이도만으로는 `.screen` 같은 클래스 선택자를 못 이긴다.
`display: grid`·`flex`·`inline-block` 을 쓰는 컴포넌트를 `el.hidden` 으로 토글할 생각이라면 이 줄이 사실상 필수다.

같은 프로젝트에서 두 번 밟았다 — 한 번은 `.gfx-fallback`, 한 번은 `.screen`.
개별 선택자마다 `[hidden]` 을 덧붙여 막는 대신 전역 규칙 하나로 두는 편이 낫다.
