---
title: "WebGL 컨텍스트"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["webgl", "browser", "graphics"]
summary: "canvas.getContext('webgl') 이 돌려주는 GPU 그리기 상태 묶음. 브라우저가 페이지당 개수를 제한한다."
altnames: ["WebGL context", "webgl", "WebGLRenderingContext"]
---

WebGL 컨텍스트는 `<canvas>` 에서 `getContext('webgl'|'webgl2')` 로 얻는 GPU 그리기 상태다. 버퍼·텍스처·셰이더는 모두 특정 컨텍스트에 속한다.

## 구조

- **컨텍스트 손실**: GPU 리셋이나 자원 부족 때 브라우저가 컨텍스트를 빼앗는다. `webglcontextlost` 이벤트가 오고 `isContextLost()` 가 `true` 가 된다.
- `WEBGL_lose_context` 확장의 `loseContext()` 로 직접 반납할 수 있다.

## 알아둘 것

- Chromium 은 페이지당 살아 있는 컨텍스트에 상한(16개 안팎)을 두고, 넘으면 **가장 오래된 것**을 lost 시킨다.
- three.js 의 `renderer.dispose()` 는 GPU 자원만 정리하고 컨텍스트는 GC 에 맡긴다. 렌더러를 자주 만들고 버리면 `forceContextLoss()` 를 함께 부른다.
