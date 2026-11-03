---
title: "헤드리스 에뮬레이터는 부팅 직후 SystemUI ANR 창이 계속 뜬다"
date: 2026-11-04T04:30:47+09:00
draft: false
tags: ["android", "emulator", "test"]
summary: "boot_completed 직후 부하가 높아 SystemUI 가 응답하지 않고, ANR 창이 adb 로 띄운 앱 화면을 가린다"
---

## 무슨 일이

`emulator -avd ... -no-window` 로 띄우고 `sys.boot_completed` 가 1이 되자마자 앱을 설치해 `adb shell input tap` 으로 조작했다. 탭이 앱에 닿지 않았고, `uiautomator dump` 에는 앱 버튼 대신 `Close app` / `Wait` 버튼만 보였다.

## 원인

[[anr]] 창은 앱이 아니라 `com.android.systemui` 의 것이었다. 트레이스의 사유는 `Input dispatching timed out ([Gesture Monitor] edge-swipe (server) is not responding` 였다. 부팅 직후 load average가 38까지 올라가 SystemUI가 입력을 5초 안에 처리하지 못했다. `Wait` 를 눌러도 몇 초 뒤 다시 떴고, 부하가 8 근처로 내려온 뒤에도 한동안 반복됐다.

## 재현

```bash
emulator -avd <avd> -no-window -no-audio -no-boot-anim &
adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 3; done
adb shell uptime                              # load average 30 이상
adb shell dumpsys window | grep mCurrentFocus  # Application Not Responding: com.android.systemui
```

## 그래서

개발자 옵션의 오류 대화상자 숨기기를 켜자 창이 더 뜨지 않았고, 그 뒤 조작은 정상이었다. 끝나면 되돌린다.

```bash
adb shell settings put global hide_error_dialogs 1
# ... 테스트 ...
adb shell settings put global hide_error_dialogs 0
```

## 한 줄

헤드리스 에뮬레이터로 UI를 자동 조작하기 전에 `dumpsys window` 의 `mCurrentFocus` 가 내 앱인지 먼저 확인하고, SystemUI ANR이면 `hide_error_dialogs 1` 을 건다.
