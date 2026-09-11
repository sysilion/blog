---
title: "캐스케이드 origin"
date: 2026-09-12T03:25:00+09:00
draft: false
tags: ["css"]
summary: "선언이 어디서 왔는지(브라우저·사용자·작성자)에 따라 정해지는 우선순위 계층. 특이도보다 먼저 비교된다."
altnames: ["cascade origin", "cascade origin and importance", "오리진"]
---

CSS 선언이 충돌할 때, 특이도를 따지기 **전에** 그 선언이 어디서 왔는지로 먼저 순서를 가른다.

## 순서

낮은 쪽부터 (같은 origin 안에서만 특이도·선언 순서를 비교한다):

1. 브라우저 기본 스타일시트 (user-agent)
2. 사용자 스타일시트 (user)
3. 작성자 스타일시트 (author) — 우리가 쓰는 CSS
4. 작성자 `!important`
5. 사용자 `!important`
6. 브라우저 `!important`

`!important` 가 붙으면 순서가 **뒤집힌다**. 그래서 사용자 설정과 접근성 스타일이 작성자 CSS 를 이길 수 있다.

## 알아둘 것

- `[hidden] { display: none }`, `h1 { font-size: 2em }`, `input { border: ... }` 같은 것이 전부 브라우저 기본 스타일시트에 있다.
  작성자 CSS 의 아무 규칙이나 같은 속성을 건드리면 특이도가 낮아도 이긴다 — origin 비교가 먼저이기 때문이다.
- 그래서 "기본 동작이 사라졌다" 류의 문제는 특이도 싸움이 아니라 origin 문제인 경우가 많다.
  기본 스타일시트의 동작을 되살리려면 작성자 쪽에서 `!important` 로 다시 선언해야 한다.
- `@layer` 는 작성자 origin **안에서만** 순서를 만든다. origin 사이의 순서는 바꾸지 못한다.
- 인라인 `style` 속성은 작성자 origin의 가장 높은 특이도로 취급되며, `!important` 는 여전히 그 위에 있다.
