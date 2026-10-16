---
title: "Taildrop"
date: 2026-10-17T08:45:44+09:00
draft: false
tags: ["tailscale", "network"]
summary: "Tailscale 네트워크(tailnet) 안의 내 기기끼리 파일을 직접 보내는 기능."
altnames: ["tailscale file"]
---

Taildrop은 같은 사용자의 tailnet 기기 사이에서 파일을 P2P로 주고받는 Tailscale 기능이다.

## 무엇인가

- 보내기: `tailscale file cp <파일...> <기기명>:` — 기기명 뒤 콜론이 필수.
- 받기: Windows·macOS GUI는 `Downloads` 폴더로 자동 저장, Linux는 `tailscale file get <dir>` 로 꺼낸다.
- 전송은 WireGuard 터널 위로 가므로 중간 서버에 파일이 남지 않는다.
- 기본적으로 **자기 소유 기기 사이**에서만 된다. 다른 사용자 기기는 대상이 아니다.

## 알아둘 것

- `-` 를 파일로 주면 stdin을 읽는다. 이때는 `--name` 으로 파일명을 지정한다.
- macOS GUI판은 샌드박스 때문에 경로 인자를 못 읽는 경우가 있다. stdin으로 우회한다.
