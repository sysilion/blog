---
title: "Chromium 은 WebGL 컨텍스트가 16개를 넘으면 가장 오래된 것을 죽인다"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["webgl", "chromium", "deskmate"]
summary: "renderer.dispose() 는 컨텍스트를 풀지 않는다. 캐릭터를 갈아입힐 때마다 쌓여, 상한을 넘으면 지금 화면의 컨텍스트가 lost 될 수 있다."
---

## 무슨 일이

deskmate 의 VRM·2.5D 렌더러는 `dispose()` 에서 three 의 `renderer.dispose()` 만 불렀다.
GPU 자원은 풀리지만 [[webgl-context]] 자체는 GC 가 수거할 때까지 남는다. 2.5D 렌더러는 개체마다(최대 8개) 하나씩 만든다.

## 원인

Chromium 은 한 페이지에 살아 있는 WebGL 컨텍스트 수에 상한(16개 안팎)을 두고, 넘으면 가장 오래된 컨텍스트를 강제로 lost 시킨다.
dispose 했지만 아직 수거되지 않은 컨텍스트도 개수에 들어간다. 순서가 꼬이면 지금 쓰는 컨텍스트가 먼저 꺼진다.

## 재현

참조를 잡은 채로 캔버스 20개에서 `getContext('webgl')` 를 만들고 첫 컨텍스트의 `isContextLost()` 를 본다.

```bash
chrome-headless-shell --headless --use-angle=swiftshader --enable-unsafe-swiftshader \
  --virtual-time-budget=3000 --dump-dom file:///.../gl.html
# {"firstLost":true,"lastLost":false}
```

## 그래서

three 렌더러는 `dispose()` 뒤에 `forceContextLoss()`, 직접 만든 컨텍스트는 `WEBGL_lose_context` 의 `loseContext()` 로 즉시 반납한다.
배포 환경인 WKWebView 의 상한은 따로 재지 않았다.

## 한 줄

> WebGL 렌더러를 치울 땐 dispose 뒤에 `forceContextLoss()` 나 `loseContext()` 까지 불러 컨텍스트를 직접 반납한다.
