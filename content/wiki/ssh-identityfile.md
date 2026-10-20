---
title: "IdentityFile"
date: 2026-10-21T01:40:34+09:00
draft: false
tags: ["ssh", "openssh"]
summary: "OpenSSH 클라이언트가 공개키 인증에 쓸 개인키 파일을 지정하는 ssh_config 옵션."
altnames: ["ssh IdentityFile", "IdentitiesOnly"]
---

**IdentityFile** 은 OpenSSH 클라이언트가 공개키 인증에 쓸 개인키 파일을 지정하는 `ssh_config` 옵션이다.

## 무엇인가

- 지정하지 않으면 기본 이름 `~/.ssh/id_rsa`, `id_ecdsa`, `id_ecdsa_sk`, `id_ed25519`, `id_ed25519_sk`, `id_dsa` 만 후보가 된다.
  그 밖의 이름을 가진 키는 agent 에 올라가 있지 않는 한 시도되지 않는다.
- `Host` 블록마다 여러 번 쓸 수 있고, 명령행의 `-i <file>` 과 같은 효과다.
- `IdentitiesOnly yes` 를 함께 쓰면 agent 에 올라간 키는 빼고, 지정한 파일만 시도한다.

## 알아둘 것

- 서버는 인증 시도 횟수를 제한한다(`MaxAuthTries`, 기본 6). 키가 많으면 맞는 키에 닿기 전에 끊길 수 있다.
  이때도 `IdentitiesOnly yes` 가 해결책이다.
- 어떤 키를 시도하는지는 `ssh -v` 출력의 `Will attempt key` / `Offering public key` 줄로 확인한다.
