---
title: "macOS GUI판 Tailscale의 file cp는 파일 경로를 못 읽는다 — stdin으로 넘기면 된다"
date: 2026-10-17T08:45:44+09:00
draft: false
tags: ["tailscale", "macos"]
summary: "tailscale file cp 가 sandbox 에러로 실패. --name 과 stdin(-)으로 우회."
---

## 무슨 일이

`~/Library/Fonts` 의 폰트를 [[taildrop]]으로 Windows 머신에 보내려 했더니 바로 실패했다.

```text
the GUI version of Tailscale on macOS runs in a macOS sandbox that can't read files
```

## 원인

App Store/standalone GUI판 Tailscale(1.104.1)의 CLI는 앱 번들 안의 바이너리를 부르고,
그 프로세스는 [[app-sandbox|macOS App Sandbox]] 안에서 돈다. 사용자가 고르지 않은 임의 경로는 읽을 수 없다.
반면 표준 입력은 셸이 열어서 넘겨주므로 샌드박스와 무관하다.

## 재현

```bash
tailscale file cp ~/Library/Fonts/foo.ttf bizu-desk:          # 실패
tailscale file cp --name foo.ttf - bizu-desk: < ~/Library/Fonts/foo.ttf   # 성공
```

## 그래서

여러 파일은 루프로 하나씩 stdin에 흘려보낸다. `--name` 을 안 주면 받는 쪽 파일명이 정해지지 않는다.

## 한 줄

GUI판 Tailscale은 파일을 못 읽지만 stdin은 받는다.
