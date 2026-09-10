---
title: "Vite가 @babylonjs/core 깊은 경로를 사전 번들링하면 셰이더 include가 GLSL에 그대로 남는다"
date: 2026-09-08T18:10:00+09:00
draft: false
tags: ["vite", "babylonjs", "webgl"]
summary: "VERTEX SHADER ERROR: '<' : syntax error 의 원인은 Vite optimizeDeps가 Babylon의 ShadersInclude 사이드이펙트 등록을 청크로 갈라 놓은 것이었다."
---

## 무슨 일이

Babylon.js 8.56 + Vite 7 프로토타입에서 `TransformNode`를 새로 import하자 콘솔에 다음이 반복됐다.

```text
BJS - Error: VERTEX SHADER ERROR: 0:7: '<' : syntax error
BJS - Error: VERTEX SHADER ERROR: 0:49: '<' : syntax error
```

메시는 그려지지 않았다. 새 deep import가 들어올 때마다 Vite가 "new dependencies optimized … reloading"을 찍은 직후였다.

## 원인

Babylon은 셰이더를 `#include<helperFunctions>` 같은 지시문으로 조립하고, 각 include는 `ShadersInclude/*.js`가 **import 사이드이펙트로** 전역 스토어에 등록한다. Vite의 [[vite-optimizedeps|optimizeDeps]]는 `@babylonjs/core/Meshes/meshBuilder` 같은 깊은 경로들을 각각 진입점으로 삼아 esbuild로 다시 묶는데, 이때 등록 모듈이 다른 청크로 갈리거나 중복돼 실제 셰이더 조립 시점에 스토어가 비어 있다. 치환되지 않은 `#include<...>`가 GLSL 컴파일러에 넘어가 `<`에서 문법 오류가 난다.

## 재현

```bash
npm create vite@latest t -- --template vanilla-ts && cd t && npm i @babylonjs/core@8
# main.ts 에서 deep import 로 Engine, Scene, MeshBuilder, StandardMaterial 을 쓰고 박스 하나를 그린다
npm run dev   # 첫 로드는 정상. 다른 파일에서 '@babylonjs/core/Meshes/transformNode' 를 추가 import 하면 재최적화 후 오류
```

## 그래서

```ts
// vite.config.ts
export default defineConfig({ optimizeDeps: { exclude: ["@babylonjs/core", "@babylonjs/havok"] } });
```

로 사전 번들링에서 빼고 `node_modules/.vite`를 지우면 ESM이 원본 경로로 그대로 서빙되고 등록 순서가 보존된다. 프로덕션 `vite build`(rollup)는 원래 영향이 없었다.

## 한 줄

Babylon + Vite에서 `'<' : syntax error`는 GLSL 문제가 아니라 사전 번들링이 include 등록을 잃은 것이다.
