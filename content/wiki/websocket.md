---
title: "WebSocket"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["network", "browser", "nodejs"]
summary: "HTTP 업그레이드로 연 하나의 TCP 연결 위에서 양방향 메시지를 주고받는 프로토콜(RFC 6455)."
altnames: ["ws", "웹소켓"]
---

WebSocket 은 HTTP `Upgrade` 요청으로 시작해, 같은 TCP 연결을 양방향 메시지 채널로 쓰는 프로토콜이다.

## 구조

- `readyState`: `0 CONNECTING` → `1 OPEN` → `2 CLOSING` → `3 CLOSED`.
- 메시지는 텍스트·바이너리 프레임. 연결 유지는 ping/pong 프레임.
- 브라우저는 `WebSocket` 전역, Node 는 `ws` 패키지가 사실상 표준이다(Node 22+ 에는 클라이언트 전역 `WebSocket` 도 있다).

## 알아둘 것

- **닫힌 소켓에 `send()` 해도 예외가 나지 않는다.** 데이터는 버려지고 `bufferedAmount` 만 는다. 보내기 전에 `readyState === OPEN` 을 확인하거나 재접속 로직을 둔다.
- `bufferedAmount` 는 아직 소켓에 쓰이지 못한 바이트 수다. 계속 늘면 상대가 못 따라오고 있다는 신호.
