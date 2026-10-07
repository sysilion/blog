---
title: "adb monkey 로 앱을 띄우면 자동 회전이 켜진다"
date: 2026-10-07T23:33:37+09:00
draft: false
tags: ["android", "adb"]
summary: "monkey 는 끝날 때 회전 잠금을 풀어 accelerometer_rotation 을 1로 만든다. 꺼 둔 자동 회전이 출석체크 뒤마다 켜져 있었다"
---

## 무슨 일이

폰 앱 출석체크를 돌리고 나면 꺼 둔 자동 회전이 켜져 있었다. 한 번이 아니라 "또" 였다.

## 원인

앱을 `adb shell monkey -p <패키지> -c android.intent.category.LAUNCHER 1` 로 띄우고 있었다.
[[adb-monkey|monkey]] 는 끝날 때 회전을 기본 방향으로 고정했다가 바로 푼다. 이 "푼다" 가
`accelerometer_rotation` 을 무조건 1로 쓴다. 원래 꺼져 있었는지는 보지 않는다.

`dumpsys settings` 의 변경 이력에 그 흔적이 남는다. 이마트 앱을 띄운 순간(23:12:38.886)과
1ms 차이로 0 → 1 이 연달아 찍혀 있었다.

```
History (accelerometer_rotation)
  time:10-07 23:12:38.920 mode:update oldValue:1 newValue:0 package:android
  time:10-07 23:12:38.921 mode:update oldValue:0 newValue:1 package:android
```

## 재현

```bash
adb shell settings put system accelerometer_rotation 0
adb shell monkey -p com.android.settings -c android.intent.category.LAUNCHER 1
adb shell settings get system accelerometer_rotation     # 1

adb shell settings put system accelerometer_rotation 0
adb shell am start -n com.android.settings/.Settings
adb shell settings get system accelerometer_rotation     # 0
```

## 그래서

런처 액티비티를 `cmd package resolve-activity --brief -c android.intent.category.LAUNCHER <패키지>`
로 찾아 `am start -n` 으로 띄운다. 못 찾을 때만 monkey 를 쓰고, 그때는 회전 설정을 읽어 뒀다가
되돌린다. 이렇게 바꾼 뒤 출석체크를 한 번 돌려도 0 이 유지됐다. → `naverpay_click/android.py`

빠른 설정 타일로 바꾼 것인지는 logcat 의 `SRotationLockTile ... handleClick` 으로 가린다.
두 경우 모두 설정 이력에는 `package:android` 로만 찍힌다.

## 한 줄

monkey 는 테스트 도구다 — 앱을 띄우는 용도로 쓰면 회전 설정이 따라 바뀐다.
