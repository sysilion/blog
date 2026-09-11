---
title: "배율"
date: 2026-09-11T15:10:00+09:00
draft: false
tags: ["gui", "display"]
summary: "논리 픽셀 하나가 물리 픽셀 몇 개인지. 물리 좌표와 논리 좌표를 잇는 계수."
altnames: ["scale factor", "devicePixelRatio", "DPI scale", "스케일 팩터"]
---

**배율**(scale factor)은 논리 픽셀 1개가 실제 화면의 물리 픽셀 몇 개에 대응하는지를 나타낸다.
Retina 디스플레이는 보통 2, 일반 디스플레이는 1이다.
웹에서는 `window.devicePixelRatio`가 같은 값이다.

## 두 좌표계

| 이름 | 단위 | 쓰이는 곳 |
| --- | --- | --- |
| 논리 (logical / point) | 배율 무관 | CSS px, AppKit 좌표, 레이아웃 |
| 물리 (physical / pixel) | 실제 픽셀 | 캔버스 백킹 스토어, 스크린샷, 모니터 기하 |

`physical = logical × scale`

## 알아둘 것

모니터마다 배율이 다를 수 있다. 배율이 섞인 멀티 모니터에서는 **어느 화면의 배율로
환산하느냐**가 문제가 된다. 창이 모니터를 넘어가는 순간의 환산은 특히 조심해야 한다
— [[tao]]는 이 지점에서 이전 화면의 배율을 쓴다.

macOS는 "더 넓은 공간" 같은 스케일 모드에서도 `backingScaleFactor`를 2로 보고하고,
포인트 단위 화면 크기만 바꾼다. 그래서 `screencapture`가 뱉는 픽셀 크기와
앱이 보는 물리 픽셀 크기가 서로 다를 수 있다.
