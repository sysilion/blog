---
title: "CHZZK"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["chzzk", "스트리밍"]
summary: "네이버의 라이브 스트리밍 플랫폼. 채팅·VOD 데이터는 비공개 API로 다룬다."
altnames: ["치지직", "chzzk"]
---

네이버가 운영하는 라이브 스트리밍 플랫폼. 실시간 채팅은 WebSocket,
VOD 채팅과 메타데이터는 HTTP [[undocumented-api|비공개 API]]로 오간다.

## 알아둘 것

VOD 채팅 수집 API는 `count` 파라미터를 무시하고 항상 200건을 준다.
커서(`playerMessageTime`) 경계의 채팅이 다음 페이지에 다시 포함되므로 중복 제거가 필요하고,
방송 시작 전 대기실 채팅 때문에 **음수 시간**이 섞여 나온다.
