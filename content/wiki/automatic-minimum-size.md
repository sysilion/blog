---
title: "자동 최소 크기"
date: 2026-09-08T11:20:00+09:00
draft: false
tags: ["CSS", "레이아웃"]
summary: "flex/grid 아이템의 min-width/min-height: auto 가 실제로 계산되는 값. 보통 내용 크기지만 스크롤 컨테이너에서는 0이다."
altnames: ["automatic minimum size", "min-height: auto", "min-width: auto", "자동 최소 사이즈"]
---

**자동 최소 크기**는 flex/grid 아이템의 `min-width` · `min-height` 가 `auto` 일 때
브라우저가 대신 채워 넣는 값이다. 아이템이 그 이하로는 줄어들지 않는 하한선이다.

## 무엇인가

일반 블록 요소의 `min-height: auto` 는 `0` 이다. 하지만 flex/grid 아이템에서는
`auto` 가 **내용 기반 최소 크기**(대략 min-content)로 계산된다. `flex-shrink` 가
아이템을 줄이다가도 내용이 들어갈 만큼에서 멈추는 이유다.

## 알아둘 것

**아이템이 [[scroll-container]] 면 자동 최소 크기가 0으로 돌아간다.** 스크롤할 수 있는
영역은 작아져도 내용에 접근할 수 있다고 보기 때문이다. 그래서 `overflow: hidden` 한 줄이
아이템을 패딩만 남기고 짓눌리게 만든다. → `notes/flex-item-overflow-hidden-crushes-content`

되살리려면 최소 크기를 직접 준다.

```css
.item { min-height: fit-content; }   /* 또는 min-height: min-content */
```

반대로 **일부러 0으로 만들어야 할 때도 있다.** 스크롤 영역을 품은 flex 자식은
`min-height: 0` 을 줘야 부모 높이를 넘겨 자라지 않고 안에서 스크롤된다. 가로축에서는
`min-width: 0` 이 텍스트 `ellipsis` 를 살리는 조건이다 — [[overflow]] 만으로는 부족하다.
