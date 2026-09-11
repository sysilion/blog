---
title: "작업 영역"
date: 2026-09-11T15:20:00+09:00
draft: false
tags: ["gui", "macos", "windows"]
summary: "모니터에서 메뉴 막대·독·작업 표시줄을 뺀, 일반 창이 실제로 쓸 수 있는 영역."
altnames: ["work area", "visibleFrame", "작업영역"]
---

**작업 영역**(work area)은 모니터 전체 영역(frame)에서 시스템 UI가 점유한 부분을 뺀 나머지다.
macOS에서는 메뉴 막대와 독, Windows에서는 작업 표시줄이 빠진다.
AppKit의 `NSScreen.visibleFrame`, Win32의 `SPI_GETWORKAREA`에 해당한다.

Tauri v2에서는 `Monitor::work_area()`로 얻는다. `Monitor::size()`는 frame이다.

## 알아둘 것

macOS는 일반 창을 메뉴 막대 영역에 올려 주지 않는다. frame 크기로 창을 만들고
`(0, 0)`에 두면 위치만 조용히 아래로 밀리고 크기는 그대로라서, **아래쪽이 화면 밖으로 나간다.**

그 위까지 덮어야 하면 창 레벨을 `NSStatusWindowLevel` 이상으로 직접 올려야 한다.
Tauri의 `always_on_top`이 쓰는 floating 레벨은 메뉴 막대보다 낮다.
