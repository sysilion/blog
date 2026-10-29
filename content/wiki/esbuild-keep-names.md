---
title: "esbuild keepNames"
date: 2026-10-22T19:45:38+09:00
draft: false
tags: ["esbuild", "javascript", "번들러"]
summary: "esbuild가 함수·클래스의 name 속성을 원래 이름으로 유지하려고 __name 헬퍼 호출을 끼워 넣는 옵션."
altnames: ["keepNames", "keep-names", "__name"]
---

[[esbuild]] 의 `keepNames` 옵션(CLI `--keep-names`). 변환이나 압축으로 함수·클래스 이름이 바뀌어도 `fn.name` 이 원래 이름을 돌려주게 한다.

## 무엇인가

esbuild는 이름이 바뀔 수 있는 함수와 클래스 뒤에 헬퍼 호출을 붙인다.

```js
var __defProp = Object.defineProperty
var __name = (target, value) => __defProp(target, 'name', { value, configurable: true })

const double = /* @__PURE__ */ __name((n) => n * 2, 'double')
```

`__name` 은 모듈(또는 번들) 맨 위에 한 번 정의되고, 각 함수는 그 헬퍼를 참조한다.

## 알아둘 것

- 기본값은 꺼져 있다. [[tsx]] 처럼 디버깅 편의를 위해 켜 두는 도구가 있다.
- 함수 하나를 `toString()` 으로 떼어 다른 실행 환경에서 다시 만들면, 본문 안의 `__name(...)` 호출만 남고 헬퍼 정의는 사라진다. `ReferenceError: __name is not defined` 가 이 경우다.
- 압축(`minify`)과 함께 쓰면 이름 보존 비용만큼 결과가 조금 커진다.
