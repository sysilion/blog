---
title: "JSON NaN"
date: 2026-11-02T02:10:38+09:00
draft: false
tags: ["json", "python"]
summary: "JSON 표준에는 NaN·Infinity가 없다. 파이썬 json은 기본으로 쓰지만 엄격한 직렬화기는 거부한다."
altnames: ["NaN in JSON", "allow_nan"]
---

JSON(RFC 8259)의 숫자 문법에는 `NaN`, `Infinity`, `-Infinity` 가 없다. IEEE 754 부동소수점이 가진 이 값들을
표현할 방법이 표준에 없다.

## 구현마다 다르다

| 구현 | 쓸 때 | 읽을 때 |
| --- | --- | --- |
| 파이썬 `json` | 기본 `allow_nan=True`, `NaN` 토큰을 그대로 출력 | `NaN` 을 받아들임 |
| Starlette `JSONResponse` | `allow_nan=False`, `ValueError` | 해당 없음 |
| 자바스크립트 `JSON` | `JSON.stringify(NaN)` 은 `null` | `JSON.parse("NaN")` 은 `SyntaxError` |

## 알아둘 것

파이썬끼리 주고받을 때는 문제가 드러나지 않다가 브라우저나 엄격한 서버를 거치는 순간 깨진다.
`json.dumps(obj, allow_nan=False)` 를 테스트에 넣으면 이런 값이 섞였는지 미리 잡을 수 있다.
pandas의 빈 Series 집계(`mean`, `max`)는 예외 없이 `nan` 을 돌려주므로 흔한 유입 경로다.
