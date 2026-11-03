---
title: "ANR"
date: 2026-11-04T04:30:47+09:00
draft: false
tags: ["android"]
summary: "Application Not Responding. 안드로이드 앱이 정해진 시간 안에 응답하지 못했을 때 시스템이 띄우는 상태"
altnames: ["Application Not Responding"]
---

ANR(Application Not Responding)은 안드로이드 프로세스가 입력이나 브로드캐스트를 제한 시간 안에 처리하지 못했을 때 시스템이 내리는 판정이다.

## 무엇인가

- **판정 기준**: 입력 이벤트를 5초 안에 처리하지 못하거나, 포그라운드 브로드캐스트 리시버가 10초 안에 끝나지 않는 경우 등. 대개 메인 스레드가 막혀서 생긴다.
- **결과**: 포그라운드면 "응답 없음" 대화상자(`Close app` / `Wait`)가 뜨고, 스레드 덤프가 `/data/anr/` 에 남는다.
- **누구의 ANR인가**: 시스템 UI(`com.android.systemui`) 같은 시스템 프로세스도 ANR을 낸다. 대화상자의 앱 이름과 덤프의 `Subject` 를 보면 구분된다.

## 알아둘 것

- 덤프의 `"main"` 스레드 스택이 원인을 가리킨다. Binder 호출에서 기다리고 있으면 상대 프로세스가 느린 것이다.
- 개발자 옵션 `hide_error_dialogs` 는 대화상자만 숨긴다. 판정과 덤프는 그대로 남는다.
