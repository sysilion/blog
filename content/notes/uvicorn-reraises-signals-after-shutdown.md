---
title: "uvicorn은 종료를 마친 뒤 받았던 시그널을 다시 던진다"
date: 2026-11-03T10:01:21+09:00
draft: false
tags: ["python", "uvicorn", "fastapi"]
summary: "SIGTERM으로 내려가는 uvicorn에 atexit을 걸었더니 돌지 않았다. 종료가 끝나면 시그널을 기본 처리기로 다시 던져 그 자리에서 죽는다."
---

## 무슨 일이

chicle 설정 페이지에 "서버 다시 시작" 버튼을 붙이면서, 자신에게 SIGTERM을 보내 uvicorn이 곱게 내려가게 한 뒤 `atexit`에서 `os.execv`로 같은 명령을 다시 띄우려 했다. lifespan 종료 구간까지는 돌았는데 `atexit` 함수는 한 번도 불리지 않았고 프로세스는 종료 코드 143으로 끝났다.

## 원인

[[uvicorn]]의 `capture_signals()`는 받은 시그널을 목록에 넣어 두고, 서버 종료가 끝나면 원래 처리기를 복구한 뒤 `signal.raise_signal`로 다시 던진다. SIGTERM의 기본 처리는 즉시 종료다. 인터프리터가 정상 종료 경로를 타지 않으니 `atexit`은 건너뛴다. 143은 128 + 15(SIGTERM)다.

## 재현

```python
# app.py
import atexit, os, signal, threading
from contextlib import asynccontextmanager
from fastapi import FastAPI

atexit.register(lambda: print("ATEXIT RAN", flush=True))

@asynccontextmanager
async def lifespan(app):
    threading.Timer(1.0, lambda: os.kill(os.getpid(), signal.SIGTERM)).start()
    yield
    print("LIFESPAN SHUTDOWN RAN", flush=True)

app = FastAPI(lifespan=lifespan)
```

```bash
python -m uvicorn app:app --port 8799 --log-level warning; echo "exit code: $?"
# LIFESPAN SHUTDOWN RAN
# exit code: 143
```

uvicorn 0.40.0, fastapi 0.162.0, Python 3.13.7에서 확인했다.

## 그래서

`execv`를 lifespan의 `yield` 다음, 관리자들의 shutdown을 모두 끝낸 자리로 옮겼다. 거기는 시그널을 다시 던지기 전이고 받던 라이브 스냅샷과 작업 저장도 끝난 뒤다.

## 한 줄

uvicorn이 내려간 뒤에 할 일은 `atexit`이 아니라 lifespan의 `yield` 아래에 둔다. SIGTERM으로 끝나는 프로세스는 `atexit`을 믿지 않는다.
