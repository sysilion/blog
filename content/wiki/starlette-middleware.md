---
title: "Starlette 미들웨어"
date: 2026-10-23T17:47:00+09:00
draft: false
tags: ["python", "fastapi", "starlette", "web"]
summary: "요청과 응답을 감싸는 ASGI 계층. 나중에 등록한 것이 가장 바깥에 놓인다."
altnames: ["Starlette middleware", "FastAPI middleware", "ASGI middleware"]
---

Starlette(그리고 그 위의 FastAPI)에서 라우트 처리 앞뒤로 요청과 응답을 가로채는 ASGI 계층.

## 무엇인가

- `app.add_middleware(Class, **opts)` 나 `@app.middleware("http")` 로 등록한다. 둘 다 같은 목록에 들어간다.
- 앱이 시작될 때 목록으로 양파 껍질 같은 스택을 만든다. 바깥 미들웨어가 요청을 먼저 받고, 응답은 마지막에 받는다.
- 등록할 때마다 목록 맨 앞에 넣는다. 그래서 코드에서 나중에 등록한 미들웨어가 가장 바깥이다.

## 알아둘 것

- 미들웨어가 `call_next` 를 부르지 않고 바로 응답을 돌려주면 그보다 안쪽 미들웨어는 그 응답을 못 본다.
  [[cors|CORS]] 헤더를 붙이는 미들웨어가 안쪽에 있으면 거절 응답에 CORS 헤더가 빠진다.
