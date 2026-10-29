---
title: "tsx"
date: 2026-10-22T19:45:38+09:00
draft: false
tags: ["typescript", "node", "도구"]
summary: "TypeScript 파일을 빌드 단계 없이 Node.js로 바로 실행하는 러너. 내부에서 esbuild로 변환한다."
altnames: ["TypeScript Execute"]
---

TypeScript 파일을 미리 컴파일하지 않고 Node.js로 바로 실행하는 CLI. `npx tsx script.ts` 처럼 `node` 자리에 쓴다.

## 구조

- Node의 모듈 로더 훅에 붙어서, 불러오는 `.ts`·`.mts`·`.tsx` 파일을 그때그때 [[esbuild]] 로 JavaScript로 바꾼다.
- 타입 검사는 하지 않는다. 타입 오류가 있어도 실행된다. 검사는 `tsc --noEmit` 에 따로 맡긴다.
- ESM과 CommonJS를 섞어 불러올 수 있고, `tsconfig.json` 의 `paths` 를 읽는다.
- `tsx watch` 는 파일이 바뀌면 다시 실행한다.

## 알아둘 것

- 변환 시 esbuild의 [[esbuild-keep-names|keepNames]] 가 켜져 있다. 함수 이름을 보존하려고 `__name(...)` 호출이 코드에 들어간다. 함수를 문자열로 직렬화해 다른 실행 환경(브라우저, 워커)으로 보내면 헬퍼가 없어 깨진다.
- 실행 속도는 빠르지만, 같은 코드를 `tsc` 로 컴파일한 결과와 바이트 단위로 같지는 않다. 함수 `toString()` 결과나 `Function.name` 에 기대는 코드는 차이를 확인해야 한다.
