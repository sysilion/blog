---
title: "FastAPI Query의 pattern은 기본값에도 적용된다"
date: 2026-11-02T17:08:58+09:00
draft: false
tags: ["fastapi", "pydantic", "python"]
summary: "쿼리 파라미터에 pattern을 걸었더니 파라미터를 안 보낸 요청이 422로 떨어졌다. 빈 기본값이 패턴 검사를 못 넘긴 것이다."
---

## 무슨 일이

chicle 백엔드의 목록 API에 날짜 필터 형식을 강제하려고 `Query(default="", pattern=r"^\d{4}-\d{2}-\d{2}$")`를 붙였다.
날짜를 보내지 않은 평범한 요청 `GET /analyses`가 422를 냈다. 응답 본문의 `input`이 빈 문자열이었다.

## 원인

[[fastapi-query]]의 `pattern`은 pydantic 필드 제약으로 바뀌고, pydantic은 요청에 값이 없을 때 기본값 `""`를 그 제약에 통과시킨다.
빈 문자열은 `^\d{4}-\d{2}-\d{2}$`에 맞지 않으니 기본값 자체가 실패한다. 기본값은 검증을 건너뛸 것이라는 짐작이 틀렸다.

## 재현

```python
from fastapi import FastAPI, Query
from fastapi.testclient import TestClient

app = FastAPI()

@app.get("/a")
def a(d: str = Query(default="", pattern=r"^\d{4}$")):
    return {"d": d}

print(TestClient(app).get("/a").status_code)  # 422
```

fastapi 0.128.0, pydantic 2.12.5에서 확인했다.

## 그래서

패턴이 빈 값도 받게 했다. `^(\d{4}-\d{2}-\d{2})?$`. 기본값을 `None`으로 두는 방법도 있지만 호출부가 전부 빈 문자열을 기대하고 있어 패턴 쪽을 고쳤다.

## 한 줄

`Query`에 `pattern`이나 `min_length`를 걸 때는 기본값이 그 제약을 통과하는지 먼저 본다. 비우는 값이 있으면 패턴에 `?`로 빈 경우를 넣는다.
