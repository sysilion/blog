---
title: "typeof 검사가 ReferenceError 를 던졌다 — 초기화에 실패한 const"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["javascript", "browser"]
summary: "다른 <script> 의 const 초기화가 예외로 끝나면 그 이름은 영원히 TDZ 에 남는다. typeof X 도 ReferenceError."
---

## 무슨 일이

subculture-timeline 은 `typeof I18n !== 'undefined'` 로 번역 모듈이 없을 때를 대비해 두었다.
그런데 브라우저 저장소가 막힌 환경에서 타임라인이 통째로 안 그려지고 `ReferenceError: I18n is not defined` 가 났다.

## 원인

`i18n.js` 맨 위의 `localStorage.getItem` 이 예외를 던져 `const I18n = (() => {...})()` 의 초기화가 실패했다.
최상위 `const` 는 스크립트들이 공유하는 선언 영역에 이름만 등록된 채 초기화되지 않은 상태, 즉 [[tdz]] 로 남는다.
이 상태의 이름에는 `typeof` 도 ReferenceError 다. "선언 안 된 이름이면 'undefined'" 라는 typeof 의 안전장치는 여기서 통하지 않는다.

## 재현

```html
<script>const X = (() => { throw new Error('init') })()</script>
<script>try { document.title = typeof X } catch (e) { document.title = e.name + ': ' + e.message }</script>
```

```bash
chrome-headless-shell --headless --dump-dom file:///.../tdz.html | grep -o '<title>[^<]*'
# <title>ReferenceError: X is not defined
```

## 그래서

실패 원인(`localStorage` 접근)을 try/catch 로 감싸 초기화가 끝나게 했다. `typeof` 가드는 이런 경우를 막지 못한다.

## 한 줄

> 최상위 const 초기화에서 예외가 날 수 있는 코드(`localStorage` 등)는 그 자리에서 try/catch 로 감싼다. 쓰는 쪽의 `typeof` 가드로는 못 막는다.
