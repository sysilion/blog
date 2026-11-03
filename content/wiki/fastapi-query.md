---
title: "FastAPI Query"
date: 2026-11-02T17:08:58+09:00
draft: false
tags: ["fastapi", "pydantic", "python"]
summary: "FastAPI에서 쿼리 파라미터의 기본값과 검증 제약을 선언하는 함수."
altnames: ["Query", "fastapi.Query"]
---

FastAPI 경로 함수의 인자에 `Query(...)`를 기본값으로 두면 그 인자가 URL 쿼리 파라미터가 되고, 함께 적은 제약이 요청마다 검증된다.

## 무엇인가

```python
from fastapi import Query

def list_items(
    q: str = Query(default="", max_length=100),
    limit: int = Query(default=20, ge=1, le=100),
    sort: str = Query(default="name", pattern="^(name|date)$"),
): ...
```

`default`, `ge`/`le`, `min_length`/`max_length`, `pattern`, `description`을 받는다. 제약은 pydantic 필드 제약으로 바뀌어 검증 실패 시 422와 위치(`loc: ["query", "sort"]`)를 돌려준다.

## 알아둘 것

- 요청에 값이 없으면 `default`가 쓰이는데, 그 기본값도 같은 제약을 통과해야 한다. `default=""`에 `pattern`을 걸면 빈 문자열이 패턴에 맞지 않는 한 모든 요청이 422다.
- 안 보낸 것과 빈 값을 구분하려면 `default=None`과 `Optional[str]`을 쓴다.
- `pattern`은 pydantic v2의 이름이다. v1 시절 `regex`는 더 이상 받지 않는다.
