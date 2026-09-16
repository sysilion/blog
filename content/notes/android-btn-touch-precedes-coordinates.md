---
title: "BTN_TOUCH DOWN이 좌표보다 먼저 와서 모든 탭이 (0,0) 스와이프가 됐다"
date: 2026-09-16T13:12:00+09:00
draft: false
tags: ["android", "adb", "input"]
summary: "getevent로 탭을 재구성할 때 DOWN 시점에 좌표를 읽으면 직전 값이 잡힌다. 한 묶음은 SYN_REPORT로 닫힌다"
---

## 무슨 일이

폰에서 사람이 누르는 걸 받아적어 자동화 스펙을 뽑으려고 [[getevent]] 스트림을 파싱했다.
탭이 하나도 안 잡히고 전부 이렇게 나왔다.

```
1. swipe (0,0) → (601,2491)
```

시작점이 전부 `(0,0)` 이다.

## 원인

[[getevent]] 로 `BTN_TOUCH DOWN` 을 보는 순간 좌표를 읽었는데, 이 기기(SM-F731N)는
`DOWN` 을 `ABS_MT_POSITION_X/Y` 보다 **먼저** 보낸다.

```
[   22915.503725] /dev/input/event5: EV_ABS  ABS_MT_TRACKING_ID  00000917
[   22915.503725] /dev/input/event5: EV_KEY  BTN_TOUCH           DOWN     ← 아직 좌표가 없다
[   22915.503725] /dev/input/event5: EV_KEY  BTN_TOOL_FINGER     DOWN
[   22915.503725] /dev/input/event5: EV_ABS  ABS_MT_POSITION_X   00000a45
[   22915.503725] /dev/input/event5: EV_ABS  ABS_MT_POSITION_Y   00000bb2
[   22915.503725] /dev/input/event5: EV_SYN  SYN_REPORT          00000000 ← 여기서 확정
```

같은 타임스탬프를 달고 있는 데서 보이듯 이건 순서가 아니라 **한 묶음**이다.
[[evdev]] 에서 묶음을 닫는 것은 `SYN_REPORT` 다. 그 전의 개별 이벤트는 아직 완성되지
않은 상태 조각이라, 어느 하나를 집어 "지금 상태" 로 읽으면 직전 묶음의 값이 섞인다.
첫 터치라 직전 값이 초기값 `0` 이었을 뿐이다.

## 재현

```bash
adb shell getevent -lt            # 장치를 지정하지 않으면 /dev/input/eventN: 접두사가 붙는다
```

화면을 한 번 누르고 위 묶음의 순서를 본다.

## 그래서

상태는 이벤트마다 갱신하되, **읽기는 `SYN_REPORT` 에서만** 한다.

```python
elif code == "BTN_TOUCH" and val == "DOWN":
    s["armed"], s["down"] = True, None      # 좌표는 아직 안 읽는다
elif code == "SYN_REPORT":
    if s["armed"] and s["down"] is None:
        s["down"] = (s["x"], s["y"])        # DOWN 직후 첫 묶음이 시작점
```

`ABS_MT_POSITION_X/Y` 의 범위는 화면 픽셀이 아니다. 이 기기는 세 터치 장치가 전부
`0~4095` 였고 화면은 `1080x2640` 이라 따로 환산해야 한다 — `getevent -pl` 이 알려준다.

## 한 줄

evdev에서 값을 읽는 시점은 `SYN_REPORT` 다. 그 전엔 묶음이 아직 안 닫혔다.
