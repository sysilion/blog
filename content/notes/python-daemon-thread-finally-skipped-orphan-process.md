---
title: "데몬 스레드의 finally에서 자식 프로세스를 끝내게 했더니 서버를 끌 때 고아로 남았다"
date: 2026-10-27T01:15:08+09:00
draft: false
tags: ["python", "subprocess", "chicle"]
summary: "uvicorn을 SIGTERM으로 끄자 yt-dlp 자식 프로세스가 부모 PID 1로 남았다. 종료 훅에서 직접 terminate해야 했다."
---

## 무슨 일이

chicle은 유튜브 라이브마다 yt-dlp를 `subprocess.Popen` 으로 띄우고, 받는 스레드의 `finally` 에서 `terminate()` 한다. 받기를 멈추는 API로 끝내면 프로세스가 깨끗이 사라졌다. 그런데 서버(uvicorn)를 SIGTERM으로 끄자 yt-dlp가 부모 PID 1인 채로 계속 돌았다.

## 원인

받는 스레드가 [[데몬 스레드]]였다. 서버의 종료 훅은 멈춤 신호만 걸고 돌아오고, 인터프리터는 데몬 스레드가 루프를 빠져나오기를 기다리지 않고 끝난다. 그래서 `finally` 가 돌 기회가 없었다.

## 재현

```bash
curl -X POST localhost:8010/live/sessions -d '{"channel":"https://www.youtube.com/@LofiGirl/live"}' -H 'content-type: application/json'
kill $(lsof -ti tcp:8010 -sTCP:LISTEN)
ps -ax -o pid,ppid,command | grep '[y]t_dlp'   # 고치기 전: ppid 1로 남는다
```

## 그래서

프로세스 객체를 런타임에 들고 있다가, 서버 종료 훅(`LiveManager.shutdown`)에서 직접 `terminate()` 한다. 고친 뒤 같은 순서로 끄면 남는 yt-dlp가 0개였다.

## 한 줄

데몬 스레드가 띄운 자식 프로세스는 스레드의 정리 코드에 맡기지 말고, 종료 훅에서 직접 끝낸 뒤 `ps` 로 남은 게 없는지 본다.
