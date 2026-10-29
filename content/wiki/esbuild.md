---
title: "esbuild"
date: 2026-10-22T19:45:38+09:00
draft: false
tags: ["javascript", "번들러", "도구"]
summary: "Go로 작성된 JavaScript·TypeScript 번들러이자 변환기. 속도가 빨라 다른 도구의 내부 엔진으로 많이 쓰인다."
altnames: []
---

Go로 작성된 JavaScript·TypeScript 번들러이자 트랜스파일러. 빌드 도구로 직접 쓰기도 하지만, [[vite]] 의 의존성 사전 번들링이나 [[tsx]] 의 실행 시 변환처럼 다른 도구 안에서 엔진으로 도는 경우가 더 흔하다.

## 구조

- `transform` 은 파일 하나를 변환만 하고, `build` 는 import 그래프를 따라 하나의 번들로 묶는다.
- 출력 형식은 `esm`·`cjs`·`iife` 를 고른다. `iife` 는 결과를 즉시 실행 함수로 감싸서 페이지 전역을 건드리지 않는다.
- `target` 으로 문법 하한을 정한다(`chrome74`, `es2019` 등). 그보다 새로운 문법은 낮춰서 출력한다.
- TypeScript는 타입만 지우고 검사하지 않는다.

## 알아둘 것

- 변환 결과에 `__name`, `__publicField`, `__commonJS` 같은 헬퍼가 들어갈 수 있다. 모두 번들 상단에 정의되므로, 함수 하나만 떼어 다른 환경으로 옮기면 헬퍼를 잃는다. → [[esbuild-keep-names]]
- `metafile: true` 로 빌드하면 번들에 들어간 입력 파일 목록을 얻을 수 있다. 번들 구성 회귀를 테스트로 고정할 때 쓴다.
