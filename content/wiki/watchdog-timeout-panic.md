---
title: "watchdog timeout panic"
date: 2026-10-20T16:28:55+09:00
draft: false
tags: ["macos", "kernel"]
summary: "watchdogd가 일정 시간 커널에 체크인하지 못하면 macOS 커널이 시스템이 멈췄다고 보고 일부러 패닉을 내 재부팅하는 것."
altnames: ["watchdog timeout", "watchdogd panic", "워치독 패닉"]
---

**watchdog timeout panic**은 macOS 사용자 공간 데몬 `watchdogd` 가 정해진 시간 안에 커널에 생존 신호(check-in)를 보내지 못했을 때,
커널이 시스템이 멈췄다고 판단해 일부러 일으키는 kernel panic이다.

## 무엇인가

```
panic(cpu N caller ...): watchdog timeout: no checkins from watchdogd in 92 seconds
```

하드웨어 고장보다는 **사용자 공간이 진행하지 못하는 상태**를 뜻하는 경우가 많다. 메모리 고갈로 인한
swap thrashing, 디스크 I/O 정체, 데몬 교착 등이 그 예다. 리포트의 `Panicked task` 는 그 순간
CPU에 올라 있던 작업일 뿐 원인 프로세스가 아닐 수 있다.

## 알아둘 것

- 리포트 위치는 `/Library/Logs/DiagnosticReports/panic-full-*.panic` 이다. 파일 시각은 재부팅 뒤 **기록된** 시각이다.
  실제 패닉 시각은 `panicString` 안의 `Calendar` epoch(16진수)로 확인한다 (`date -r $((16#<hex>))`).
- JSON 본문의 `memoryStatus`(compressor, free 페이지 수)와 `processByPid` 의 `residentMemoryBytes` 로
  메모리를 많이 쓰던 프로세스를 추릴 수 있다.
- 재부팅 시각은 `last reboot` 로 확인한다.
