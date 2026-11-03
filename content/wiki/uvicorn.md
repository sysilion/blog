---
title: "uvicorn"
date: 2026-11-03T10:01:21+09:00
draft: false
tags: ["python", "asgi", "fastapi"]
summary: "FastAPI와 Starlette 앱을 띄우는 파이썬 ASGI 서버."
altnames: ["Uvicorn"]
---

uvicorn은 ASGI 앱(FastAPI, Starlette 등)을 HTTP로 노출하는 파이썬 서버다.

## 무엇인가

`python -m uvicorn app.main:app --port 8000`처럼 모듈 경로로 앱을 지정해 띄운다. `--reload`를 주면 감시자 프로세스가 앱을 돌리는 워커를 `multiprocessing`으로 따로 띄우고, `.py` 파일의 mtime이 바뀌면 워커를 죽이고 새로 띄운다. 감시자는 파일 변화만 본다. 워커가 스스로 죽어도 다시 띄우지 않는다.

SIGINT와 SIGTERM을 받으면 새 연결을 끊고, 열린 연결이 끝나길 기다린 뒤 앱의 lifespan 종료 구간을 돌리고 내려간다.

## 알아둘 것

- 시그널 처리기는 `Server.serve()`를 감싼 `capture_signals()`가 건다. 받은 시그널은 목록에 쌓아 두고, 종료가 끝나면 원래 처리기를 복구한 다음 쌓아 둔 시그널을 `signal.raise_signal`로 다시 던진다. SIGTERM의 기본 처리는 즉시 종료라 `atexit`에 건 함수는 돌지 않는다. SIGINT는 `KeyboardInterrupt`가 되므로 `atexit`까지 간다.
- 종료 뒤에 무언가를 해야 하면(재실행, 정리) `atexit`이 아니라 lifespan의 `yield` 다음에 둔다. 그 자리는 시그널을 다시 던지기 전이다.
- `--reload` 워커 안에서는 `sys.orig_argv`가 `multiprocessing` spawn 보일러플레이트다. 자신을 같은 명령으로 다시 띄우려면 `multiprocessing.parent_process()`로 워커인지 먼저 가린다.
