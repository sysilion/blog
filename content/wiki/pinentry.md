---
title: "pinentry"
date: 2026-10-19T05:53:00+09:00
draft: false
tags: ["gpg", "security"]
summary: "gpg-agent가 PIN·passphrase 입력을 맡기는 별도 프로그램."
altnames: ["pinentry-mac", "pinentry-curses", "pinentry-tty"]
---

pinentry는 GnuPG가 PIN이나 passphrase를 사용자에게 물을 때 대신 입력창을 띄워 주는 작은 프로그램이다.

## 무엇인가

- gpg는 passphrase를 직접 읽지 않는다. `gpg → gpg-agent → pinentry` 순서로 요청이 넘어간다.
- 구현이 여러 개다. `pinentry-curses`·`pinentry-tty`는 터미널에, `pinentry-mac`·`pinentry-gnome3`는 GUI 창에 입력란을 띄운다.
- 어떤 것을 쓸지는 `~/.gnupg/gpg-agent.conf`의 `pinentry-program`으로 정한다. 지정하지 않으면 설치된 기본 구현을 쓴다.
- 입력받은 passphrase는 gpg-agent가 일정 시간 캐시한다(`default-cache-ttl`).

## 알아둘 것

- 터미널용 pinentry는 TTY가 필요하다. TTY가 없으면 `Inappropriate ioctl for device`와 함께 `Operation cancelled`로 끝난다.
- 터미널 pinentry를 쓴다면 셸에서 `export GPG_TTY="$(tty)"`를 설정해 둔다.
- 대화형 입력 없이 처리하려면 `--batch --pinentry-mode loopback --passphrase-fd N`처럼 gpg가 직접 passphrase를 받게 한다. `--passphrase`로 명령줄에 넣으면 프로세스 목록에 노출된다.
