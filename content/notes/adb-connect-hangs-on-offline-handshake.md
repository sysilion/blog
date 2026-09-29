---
title: "adb connect 는 TCP 가 열려도 핸드셰이크에서 멈출 수 있다"
date: 2026-09-29T09:37:48+09:00
draft: false
tags: ["android", "adb", "python"]
summary: "포트는 열리는데 기기가 offline 으로 남으면 adb connect 가 10초를 넘기고, 잡지 않은 TimeoutExpired 가 포트 스캔 전체를 죽인다"
---

## 무슨 일이

앱 출석체크 예약이 포트 스캔 도중 트레이스백으로 끝났다.

```
[INFO]   100.66.206.67 의 30000-50000 포트를 훑는다
subprocess.TimeoutExpired: Command '['adb', 'connect', '100.66.206.67:33693']'
    timed out after 10.0 seconds
```

스캔이 찾은 첫 포트에서 멈췄고, 그 뒤 포트는 보지도 못했다.

## 원인

그 포트는 TCP 로는 열려 있는데 [[adb]] 핸드셰이크가 끝나지 않았다.
`adb connect` 는 답을 주지 않고, 기기 목록에는 `offline` 으로만 남는다.

```bash
nc -vz -w3 100.66.206.67 33693     # Connection ... succeeded!
timeout 20 adb connect 100.66.206.67:33693   # failed to connect
adb devices                        # 100.66.206.67:33693  offline
```

`subprocess.run(..., timeout=10)` 은 시간이 넘으면 **예외를 던진다.** 반환값으로
실패를 알려주지 않는다. 연결 확인(`alive()`)은 이 예외를 잡고 있었지만 `adb connect`
두 곳은 잡지 않았다.

## 그래서

`adb connect` 를 `_connect()` 로 감싸 `TimeoutExpired` 를 삼키게 했다. 붙었는지는
원래대로 뒤따르는 `alive()` 가 판정한다. 고친 뒤 다시 돌리자 스캔이 다음 포트(42947)까지 가서 붙었고
여덟 앱 출석이 모두 끝났다. → `naverpay_click/android.py`

## 한 줄

`subprocess.run` 의 `timeout` 은 실패를 돌려주지 않고 던진다 — 반복문 안이면 반드시 잡는다.
