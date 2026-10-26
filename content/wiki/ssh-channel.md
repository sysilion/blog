---
title: "SSH 채널"
date: 2026-10-23T16:52:56+09:00
draft: false
tags: ["ssh", "network"]
summary: "SSH 연결 하나 안에서 셸·명령 실행·포트 포워딩을 따로따로 실어 나르는 논리 통로."
altnames: ["ssh channel", "exec channel", "session channel"]
---

SSH 채널은 TCP 연결 하나 위에 여러 개를 동시에 열 수 있는 논리 통로다(RFC 4254).

## 구조

- 클라이언트가 `CHANNEL_OPEN` 을 보내고 서버가 `OPEN_CONFIRMATION` 이나 `OPEN_FAILURE` 로 답한다.
- 종류는 `session`(셸, `exec`, `subsystem`), `direct-tcpip`(로컬 포워딩), `forwarded-tcpip`(원격 포워딩) 등이 있다.
- 채널마다 흐름 제어 창(window)이 따로 있어서, 한 채널이 막혀도 원칙적으로 다른 채널은 움직인다.
- OpenSSH `ControlMaster` 는 이 구조를 이용해 새 `ssh` 명령을 기존 연결의 채널로 띄운다.

## 알아둘 것

- 채널 열기에는 표준 타임아웃이 없다. 시간 제한은 클라이언트가 직접 건다.
- 서버 `MaxSessions`(기본 10)는 연결 하나당 동시에 열 수 있는 `session` 채널 수다.
  넘으면 오래 기다리지 않고 바로 `OPEN_FAILURE` 가 온다. 응답 없이 시간이 넘어가면 다른 원인을 찾아야 한다.
- 연결이 반쯤 죽은(half-open) 상태면 채널 열기 요청이 응답 없이 사라진다. 이걸 빨리 알아내려고 keepalive를 쓴다.
