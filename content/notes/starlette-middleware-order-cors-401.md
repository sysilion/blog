---
title: "Starlette는 나중에 등록한 미들웨어를 바깥에 둔다. CORS를 먼저 등록하면 401에 CORS 헤더가 빠진다"
date: 2026-10-23T17:47:00+09:00
draft: false
tags: ["fastapi", "starlette", "cors"]
summary: "토큰 검사 미들웨어 뒤에 CORS를 등록해야 401 응답에도 Access-Control-Allow-Origin이 붙는다."
---

## 무슨 일이

chicle 백엔드에 쓰기 요청용 토큰 검사를 `@app.middleware("http")` 로 넣었다. 파일 위쪽에는 원래
`app.add_middleware(CORSMiddleware, ...)` 가 있었고, 토큰 미들웨어는 그 아래에 정의했다.
코드 순서만 보면 CORS가 먼저 돌 것 같았는데, 토큰이 틀린 요청의 401 응답에는
`Access-Control-Allow-Origin` 이 없었다. 브라우저에서는 이게 401이 아니라 CORS 오류로 보인다.

## 원인

[[starlette-middleware|Starlette 미들웨어]]는 등록할 때마다 목록 맨 앞에 끼워 넣는다. 그래서 나중에 등록한 것이
가장 바깥에서 요청을 먼저 받는다. 토큰 미들웨어가 [[cors|CORS]]보다 바깥에 있었고, 401을 바로 돌려주는 바람에
CORS 미들웨어는 응답을 보지도 못했다.

## 재현

starlette 0.50.0, fastapi 0.128.0.

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient

def build(cors_first):
    app = FastAPI()
    add = lambda: app.add_middleware(CORSMiddleware, allow_origins=["http://x"],
                                     allow_methods=["*"], allow_headers=["*"])
    if cors_first: add()
    @app.middleware("http")
    async def deny(request: Request, call_next):
        return JSONResponse(status_code=401, content={})
    if not cors_first: add()
    @app.post("/")
    def p(): return {}
    return app

for first in (True, False):
    r = TestClient(build(first)).post("/", headers={"Origin": "http://x"})
    print(first, r.status_code, r.headers.get("access-control-allow-origin"))
# True 401 None
# False 401 http://x
```

## 그래서

토큰 미들웨어를 정의한 다음에 `add_middleware(CORSMiddleware, ...)` 를 부르도록 옮겼다.
등록 순서를 바꾼 이유를 주석으로 남겨 두지 않으면 누군가 "설정은 위에 모아 두자"며 다시 올릴 것 같다.

## 한 줄

요청을 거절하는 미들웨어를 추가하면 CORS 등록을 그보다 아래로 내리고, Origin 헤더를 붙인 거절 요청으로 응답 헤더를 확인한다.
