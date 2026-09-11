---
title: "Playwright sync API 에서 time.sleep 으로 기다리면 응답 콜백이 영영 안 돈다"
date: 2026-09-10T17:40:00+09:00
draft: false
tags: ["playwright", "python", "자동화"]
summary: "page.on('response') 리스너를 걸어두고 time.sleep 루프로 기다렸더니, 응답이 도착했는데도 핸들러가 한 번도 실행되지 않았다."
---

## 무슨 일이

[[playwright]] 로 페이지가 보낸 요청의 응답을 엿듣기 위해 `page.on("response")` 를 걸고,
값이 채워질 때까지 기다리는 루프를 이렇게 썼다.

```python
watcher = ApiWatcher(page)          # page.on("response", ...) 등록
...
for _ in range(40):
    if watcher.status:
        break
    time.sleep(0.5)                 # ← 여기
```

20초를 꽉 채우고 `watcher.status` 는 끝까지 `None` 이었다. 그런데 같은 요청을
`page.wait_for_timeout(8000)` 으로 기다린 별도 스크립트에서는 멀쩡히 잡혔다.

## 원인

**sync API 의 이벤트 콜백은 다른 Playwright 호출 중에만 디스패치된다.**
콜백은 큐에 쌓이고, 파이썬이 Playwright 서버로 다음 명령을 보낼 때 함께 꺼내 처리된다.
`time.sleep()` 은 Playwright 를 전혀 건드리지 않으므로 큐가 그대로 쌓인 채 루프가 끝난다.

응답을 못 받은 게 아니라 **받아놓고 꺼내지 않은 것**이다. 루프 뒤에 아무 Playwright
호출이나 하나 넣으면 그제야 밀린 콜백이 한꺼번에 터진다.

## 재현

```python
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    hits = []
    pg.on("response", lambda r: hits.append(r.url))
    pg.goto("https://example.com")
    hits.clear()

    # 1.5초 뒤에 fetch 를 날리도록 예약해두고 곧바로 반환된다
    pg.evaluate("() => { setTimeout(() => fetch('/?late=1'), 1500); }")

    time.sleep(4)
    print("time.sleep 4초 후 :", len(hits))     # 0

    pg.wait_for_timeout(100)                    # Playwright 호출 한 번
    print("wait_for_timeout 후:", len(hits))    # 1 — 밀린 게 쏟아진다
    b.close()
```

```
time.sleep 4초 후 : 0
wait_for_timeout 후: 1
```

응답이 **이미 4초 전에 도착해 있었는데도** 0이다. `wait_for_timeout` 한 번에 1이 된다.

`goto()` 직후의 응답으로는 재현되지 않는다 — `goto` 자체가 Playwright 호출이라
그 안에서 콜백이 이미 처리되기 때문이다. 함정은 **goto 이후 늦게 도착하는 응답**을
`time.sleep` 으로 기다릴 때만 드러난다.

## 그래서

대기 루프는 `page.wait_for_timeout(ms)` 으로 재운다. `time.sleep` 은 Playwright 를
부르지 않는 구간(순수 지연, 사람처럼 보이려는 딜레이)에만 남긴다.

```python
def _tick(page, ms=500):
    try:
        page.wait_for_timeout(ms)
    except Exception:
        time.sleep(ms / 1000)
```

`page.evaluate` 로 상태를 폴링하는 루프는 이미 매 바퀴 Playwright 를 부르고 있어서
이 함정에 걸리지 않는다 — 그래서 같은 코드 안에서도 어떤 값은 채워지고 어떤 값은
비는, 헷갈리는 증상이 나온다.

## 한 줄

sync Playwright 에서 `time.sleep` 은 기다리는 게 아니라 **눈을 감는 것**이다.
