---
title: "보안 컨텍스트"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["브라우저", "보안"]
summary: "강력한 웹 API를 허용하는 조건. HTTPS 또는 localhost."
altnames: ["secure context", "isSecureContext"]
---

브라우저가 강력한 웹 API를 노출하기 위해 요구하는 조건. `window.isSecureContext` 로 확인한다.

## 조건

- HTTPS 로 서비스되는 출처
- **`http://localhost` 와 `127.0.0.1` 은 HTTP여도 보안 컨텍스트로 취급된다**
- `file://` 도 보안 컨텍스트다

[[service-worker|서비스 워커]], Web Crypto, 지오로케이션 등이 이 조건에 걸린다.

## 알아둘 것

**self-signed 인증서로 띄운 HTTPS는 보안 컨텍스트 조건을 통과하더라도 실무에서 막힌다.**
브라우저가 인증서 경고를 띄우고, 그 상태에서는 서비스 워커 등록이 되지 않는다.

localhost는 HTTP여도 보안 컨텍스트이므로, 로컬 검증은 **평문 HTTP 서버**로 띄우는 쪽이 빠르다.
