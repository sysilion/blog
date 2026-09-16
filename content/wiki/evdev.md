---
title: "evdev"
date: 2026-09-16T13:12:00+09:00
draft: false
tags: ["linux", "input"]
summary: "리눅스 커널의 입력 이벤트 인터페이스. 이벤트 여럿이 SYN_REPORT로 한 묶음이 된다"
altnames: ["Linux input event", "input event protocol"]
---

리눅스 커널이 입력 장치를 사용자 공간에 노출하는 인터페이스다. `/dev/input/event*` 를
읽으면 `(type, code, value)` 세 값으로 된 이벤트가 흘러나온다.

## 구조

한 번의 물리적 변화가 이벤트 **여러 개**로 쪼개져 온다. 손가락 하나가 닿으면 접촉 ID,
버튼 상태, X 좌표, Y 좌표, 접촉 면적이 각각 별도 이벤트다. 이것들을 묶어 "하나의 상태"
로 만드는 구분자가 `EV_SYN / SYN_REPORT` 다.

```
EV_ABS  ABS_MT_TRACKING_ID  ...
EV_KEY  BTN_TOUCH           DOWN
EV_ABS  ABS_MT_POSITION_X   ...
EV_ABS  ABS_MT_POSITION_Y   ...
EV_SYN  SYN_REPORT          0      ← 여기까지가 한 묶음
```

멀티터치는 **프로토콜 B** 를 쓴다. 손가락마다 슬롯(`ABS_MT_SLOT`)과 추적 ID
(`ABS_MT_TRACKING_ID`)가 있고, 추적 ID 가 `-1`(`ffffffff`)이 되면 그 손가락이 떨어진 것이다.

## 알아둘 것

- **묶음 안의 이벤트 순서는 보장이 아니다.** 장치 드라이버마다 다르다. 어떤 기기는
  `BTN_TOUCH DOWN` 을 좌표보다 먼저 보낸다. 상태를 읽어야 하는 시점은 언제나
  `SYN_REPORT` 다. → [[android-btn-touch-precedes-coordinates]]
- 축의 범위(`min`/`max`)는 장치가 스스로 보고한다. 화면 해상도와 무관하다.
