---
title: "TDZ"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["javascript"]
summary: "let/const/class 이름이 선언됐지만 아직 초기화되지 않은 구간. 이 구간에서 이름을 읽으면 ReferenceError."
altnames: ["Temporal Dead Zone", "일시적 사각지대"]
---

TDZ(Temporal Dead Zone)는 `let`·`const`·`class` 로 선언한 이름이 스코프에 **존재하지만 초기화되지 않은** 상태다.

## 구조

- 스코프에 들어가는 순간 이름이 만들어지고(호이스팅), 선언문이 실행돼야 초기화된다. 그 사이에 이름을 읽거나 쓰면 `ReferenceError`.
- `var` 는 즉시 `undefined` 로 초기화되므로 TDZ 가 없다.

## 알아둘 것

- **`typeof` 도 TDZ 에서는 예외를 던진다.** 선언 자체가 없는 이름에만 `'undefined'` 를 돌려준다.
- 브라우저의 classic `<script>` 들은 최상위 `let`/`const` 를 공유하는 선언 영역에 둔다. 한 스크립트에서 초기화가 예외로 끝나면 그 이름은 **영구히** TDZ 에 남고, 같은 이름을 다시 선언할 수도 없다.
