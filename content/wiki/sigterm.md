---
title: "SIGTERM"
date: 2026-09-29T09:44:17+09:00
draft: false
tags: ["unix", "python", "signal"]
summary: "프로세스에 종료를 요청하는 유닉스 신호. kill 과 timeout 의 기본 신호다."
altnames: ["signal 15", "TERM"]
---

SIGTERM 은 프로세스에 "정리하고 끝내라" 고 요청하는 유닉스 신호(15번)다.

## 무엇인가

- `kill <pid>` 와 `timeout` 이 기본으로 보내는 신호다. launchd·systemd 도 서비스를 멈출 때 먼저 이걸 보낸다.
- SIGKILL(9)과 달리 **잡을 수 있다.** 핸들러를 걸면 정리 작업을 한 뒤 끝낼 수 있다.
- 핸들러가 없으면 기본 동작은 즉시 종료다.

## 알아둘 것

- **파이썬은 SIGTERM 을 예외로 바꾸지 않는다.** SIGINT(Ctrl-C)는 `KeyboardInterrupt` 가
  되어 `finally`·`with` 의 정리 코드가 돌지만, SIGTERM 은 핸들러가 없으면 그것들을
  건너뛰고 죽는다.
- 정리가 필요하면 `signal.signal(signal.SIGTERM, handler)` 로 핸들러를 걸고, 그 안에서
  예외를 던져 `finally` 로 보낸다.
- 핸들러는 메인 스레드에서만 걸 수 있다. 다른 스레드에서 걸면 `ValueError` 가 난다.
- SIGKILL 은 어떤 핸들러로도 막을 수 없다. 반드시 되돌려야 하는 상태라면 프로세스
  바깥(워치독, 파일 기록)에도 남겨 둔다.
