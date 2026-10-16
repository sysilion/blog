---
title: "App Sandbox"
date: 2026-10-17T08:45:44+09:00
draft: false
tags: ["macos", "security"]
summary: "macOS 앱이 entitlements로 허가받은 자원에만 접근하게 가두는 커널 수준 격리."
altnames: ["macOS App Sandbox", "샌드박스"]
---

App Sandbox는 앱 프로세스가 entitlements에 선언된 자원에만 접근하도록 커널이 제한하는 macOS 격리 기구다.

## 무엇인가

- App Store 배포 앱은 필수. 각 앱은 `~/Library/Containers/<bundle-id>/` 를 자기 홈처럼 쓴다.
- 파일 접근은 컨테이너 내부 + 사용자가 열기 패널 등으로 **직접 고른 파일**(security-scoped bookmark)만 허용된다.
- 네트워크·카메라·USB 등도 각각 entitlement가 있어야 한다.

## 알아둘 것

- 샌드박스 앱이 동봉한 CLI도 같은 제약을 받는다. 셸에서 경로를 넘겨도 못 읽을 수 있다.
- 표준 입력·출력은 이미 열린 파일 디스크립터라 제약을 받지 않는다. CLI 우회로로 쓸 수 있다.
