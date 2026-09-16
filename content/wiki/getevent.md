---
title: "getevent"
date: 2026-09-16T13:12:00+09:00
draft: false
tags: ["android", "adb", "input"]
summary: "안드로이드에서 /dev/input/event* 의 원시 입력 이벤트를 그대로 찍어주는 명령"
altnames: ["adb getevent"]
---

안드로이드 기기의 커널 입력 장치(`/dev/input/event*`)에서 올라오는 [[evdev]] 이벤트를
가공 없이 출력하는 명령이다.

## 무엇인가

`adb shell getevent` 로 쓴다. 자주 쓰는 꼴은 셋이다.

| 꼴 | 하는 일 |
| --- | --- |
| `getevent -l` | 숫자 코드를 `ABS_MT_POSITION_X` 같은 이름으로 |
| `getevent -t` | 타임스탬프를 앞에 |
| `getevent -pl` | 이벤트가 아니라 **장치 목록과 각 축의 범위**를 |

장치를 지정하지 않으면 **모든 입력 장치**를 한 스트림으로 내보내고, 각 줄 앞에
`/dev/input/eventN:` 이 붙는다. 폴더블처럼 터치스크린이 여러 개인 기기에서 어느 화면을
쓰는지 미리 고를 필요가 없어진다.

```
[   22915.503725] /dev/input/event5: EV_ABS  ABS_MT_POSITION_X  00000a45
```

값은 **16진수**다.

## 알아둘 것

- **좌표 범위는 화면 픽셀이 아니다.** 터치 패널의 고유 해상도다. `getevent -pl` 의
  `max` 를 읽어 화면 크기로 환산해야 한다.
- **읽는 시점은 `SYN_REPORT`** 다. 개별 이벤트는 아직 안 닫힌 묶음의 조각이다.
- **`adb shell input tap` 은 여기 안 잡힌다.** `input` 은 `InputManager` 로 주입해
  커널 입력 장치를 거치지 않는다. 반대로 `sendevent` 는 `/dev/input` 에 직접 쓰므로
  잡히지만, 삼성 기기에서는 shell 계정에 쓰기 권한이 없어 `Permission denied` 다.
  읽기는 되고 쓰기만 막힌다.
