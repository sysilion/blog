---
title: "결과 dict에 NaN 하나가 섞이면 FastAPI 응답이 500으로 떨어진다"
date: 2026-11-02T02:10:38+09:00
draft: false
tags: ["fastapi", "starlette", "python", "pandas"]
summary: "채팅을 전부 제외하면 pandas 평균이 NaN이 되고, Starlette JSONResponse가 직렬화를 거부해 결과 조회가 500이 된다."
---

## 무슨 일이

chicle 리뷰 중에 제외 구간을 VOD 전체(`[[0, None]]`)로 주면 분석 결과 조회가 500이 나는 경로를 찾았다.
채팅이 하나도 안 남으면 빈 DataFrame에서 `avg_cps`, `peak_cps` 를 구하게 되고, 그 값이 `nan` 이다.
분석 자체는 예외 없이 끝나고 DB에도 저장된다. 응답을 만드는 순간에만 터진다.

## 원인

Starlette의 `JSONResponse` 는 `json.dumps(..., allow_nan=False)` 로 직렬화한다.
파이썬 `json` 은 기본값(`allow_nan=True`)이면 `NaN` 이라는 토큰을 그대로 쓰는데,
이것은 [[json-nan|JSON 표준에 없는 값]]이라 Starlette는 일부러 거부한다. 빈 Series의 `mean()`/`max()` 는 예외 대신 `nan` 을 돌려주므로
계산 단계에서는 아무 신호가 없다.

## 재현

```bash
python -c "
from starlette.responses import JSONResponse
JSONResponse({'x': float('nan')})
"
# ValueError: Out of range float values are not JSON compliant: nan   (starlette 0.50.0)

python -c "import pandas as pd; print(pd.Series([], dtype=float).mean())"
# nan
```

## 그래서

pandas 집계값을 응답에 넣는 곳은 빈 입력일 때 0.0이나 `None` 으로 바꿔 둔다.
`float('inf')` 도 같은 이유로 거부된다.

## 한 줄

FastAPI가 원인 모를 500을 내고 로그에 `not JSON compliant` 가 보이면, 빈 DataFrame에서 나온 집계값부터 찾는다.
