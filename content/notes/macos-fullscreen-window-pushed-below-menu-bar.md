---
title: "화면 크기 그대로 만든 창이 메뉴 막대 높이만큼 아래로 밀린다"
date: 2026-09-11T15:20:00+09:00
draft: false
tags: ["macos", "tauri", "window", "삽질"]
summary: "일반 창은 메뉴 막대 위로 올라가지 못한다. frame 크기로 만들면 아래가 화면 밖으로 나간다."
---

## 무슨 일이

모니터를 통째로 덮는 투명 오버레이를 만들려고 `monitor.size()` 그대로 창을 잡았다.
2880x1800 화면에 2880x1800 창, 위치 (0, 0).

화면 바닥에 서 있어야 할 캐릭터의 다리가 잘렸다. 창 기하를 찍어 보니:

```
요청: 2880x1800 @ (0, 0)
실제: 2880x1800 @ (0, 50)
```

y가 50(물리 픽셀, 배율 2니까 25 포인트) 내려가 있다. 메뉴 막대 높이다.
창은 요청한 크기를 유지한 채로 통째로 밀렸고, 그만큼 아래쪽이 화면 밖으로 나갔다.

## 원인

macOS는 일반 창(`NSWindow`의 기본 레벨)을 메뉴 막대 영역에 올려 주지 않는다.
위치를 그 영역으로 요청하면 조용히 아래로 클램프한다. 크기는 안 건드린다.

## 그래서

frame이 아니라 **[[work-area|작업 영역]]** 에 맞춘다. 메뉴 막대와 독을 뺀 영역이다.

```rust
let area = monitor.work_area();     // tauri v2: Monitor::work_area()
window.set_position(PhysicalPosition::new(area.position.x, area.position.y))?;
window.set_size(PhysicalSize::new(area.size.width, area.size.height))?;
```

```
overlay-0 settled at 2880x1750 @ (0, 50)     # 1800 - 50
overlay-1 settled at 1920x1055 @ (-223, -1055)
```

의미상으로도 이쪽이 맞다. 데스크탑 마스코트가 걸어다닐 바닥은 메뉴 막대가 아니라 작업 영역의 아래끝이다.

메뉴 막대나 독 위까지 덮고 싶으면 창 레벨을 직접 `NSStatusWindowLevel` 이상으로 올려야 한다.
Tauri의 `always_on_top`은 그보다 낮은 floating 레벨을 쓴다.

## 한 줄

macOS에서 "화면 전체를 덮는 창"은 `monitor.size()`가 아니라 `monitor.work_area()`다.
