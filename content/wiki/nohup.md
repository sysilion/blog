---
title: "nohup"
date: 2026-09-23T17:11:07+09:00
draft: false
tags: ["unix", "shell", "process"]
summary: "SIGHUP 을 무시하게 한 뒤 명령을 실행해서, 터미널·세션이 끊겨도 프로세스가 살아남게 하는 POSIX 유틸리티."
altnames: ["no hangup"]
---

터미널이나 SSH 세션이 끊길 때 오는 `SIGHUP` 을 무시하도록 설정한 뒤 주어진 명령을 `exec` 하는 POSIX 유틸리티.

## 무엇인가

- `nohup cmd args...` 는 `SIGHUP` 을 `SIG_IGN` 으로 바꾸고 `cmd` 를 실행한다. 무시 설정은 exec 뒤에도 유지된다.
- stdout 이 터미널이면 `nohup.out` 으로 돌린다. 이미 리다이렉트했다면 건드리지 않는다.
- 백그라운드 실행은 해주지 않는다. 보통 `nohup cmd </dev/null >log 2>&1 &` 처럼 `&` 와 함께 쓴다.
- 명령을 찾지 못하면 127, 실행하지 못하면 126 으로 끝난다. `nohup` 자체가 실패해도 127 이 나온다.

## 알아둘 것

- 구현마다 하는 일이 조금씩 다르다. macOS 의 `/usr/bin/nohup` 은 HUP 을 무시하는 것 외에 콘솔 세션에서 떨어져 나오는 단계를 거치고, 이 단계가 실패하면 명령을 실행하지 않고 끝난다.
- 세션이 끊길 때 프로세스가 죽는 이유가 HUP 만은 아니다. 프로세스 그룹 정리나 systemd `KillUserProcesses` 같은 경우에는 `setsid` 나 서비스 매니저가 필요하다.
- HUP 만 무시하면 되는 곳에서는 셸의 `trap '' HUP; exec "$@"` 로 같은 효과를 낼 수 있다.
