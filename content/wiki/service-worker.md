---
title: "서비스 워커"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["브라우저", "pwa"]
summary: "페이지와 별개로 도는 네트워크 프록시 스크립트. PWA의 오프라인 동작을 담당한다."
altnames: ["Service Worker", "serviceWorker", "sw.js"]
---

페이지와 독립적으로 도는 백그라운드 스크립트. `fetch` 이벤트를 가로채 캐시로 응답할 수 있어
[[pwa|PWA]] 의 오프라인 동작과 설치형 경험을 담당한다.

## 알아둘 것

- 등록에 [[secure-context|보안 컨텍스트]]가 필요하다. 인증서 경고가 뜬 HTTPS에서는 등록되지 않는다.
- 스코프는 스크립트 경로가 정한다. 루트 스코프를 원하면 스크립트도 루트에 둔다.
- 빌드 산출물에서 확인해야 의미가 있다. 개발 서버의 동작과 다르기 때문이다.

웹 매니페스트도 함께 걸린다. `.webmanifest` 는 파이썬 `mimetypes` 에 등록돼 있지 않아
간이 HTTP 서버로 띄우면 `application/octet-stream` 으로 나간다.
