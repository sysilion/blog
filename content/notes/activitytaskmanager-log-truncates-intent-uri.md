---
title: "logcat의 인텐트 로그는 URL 경로를 지운다 — dumpsys는 안 지운다"
date: 2026-09-16T13:14:00+09:00
draft: false
tags: ["android", "adb", "logcat"]
summary: "ActivityTaskManager가 찍는 dat= 는 toSafeString()을 거쳐 호스트만 남는다. 같은 인텐트가 dumpsys에는 온전히 있다"
---

## 무슨 일이

앱이 어떤 딥링크로 화면을 여는지 알아내려고 `ActivityTaskManager` 로그를 흘려 받았다.
URL 이 이렇게 왔다.

```
dat=https://promo.11st.co.kr/...
```

경로가 통째로 `...` 다. 딥링크를 알아내는 게 목적인데 정작 그 부분이 없다.

## 원인

`ActivityTaskManager` 는 인텐트를 [[intent|Intent]]`.toShortString()` 으로 찍고, 그게
안에서 `Uri.toSafeString()` 을 부른다. 이 함수는 로그에 개인정보가 새는 걸 막으려고
**스킴과 호스트만 남기고 경로·쿼리를 지운다.** `tel:`·`mailto:` 도 같은 취급이다.

의도된 동작이라 옵션으로 끌 수 없다. `logcat -b events` 의 `wm_create_activity`,
`wm_new_intent` 도 같은 문자열을 쓰므로 거기서도 잘려 있다.

## 재현

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://promo.11st.co.kr/view/m/20250201-benefit"

adb shell logcat -d -s ActivityTaskManager:I | grep -o "dat=[^ }]*" | tail -1
# → dat=https://promo.11st.co.kr/...

adb shell dumpsys activity activities | grep -o "dat=[^ }]*" | sort -u
# → dat=https://promo.11st.co.kr/view/m/20250201-benefit
```

## 그래서

`logcat` 은 '뭔가 떴다' 는 **신호**로만 쓰고, URL 은 `dumpsys activity activities` 에서
읽는다. `dumpsys` 는 액티비티 스택에 살아 있는 인텐트를 원본 그대로 갖고 있다.

덤으로, `dumpsys activity activities` 는 무선 [[adb]] 로도 0.2초에 123KB 가 온다.
기기에서 `grep` 으로 줄여 보내려고 파이프로 넘겼더니 **80초에 331KB** 로 오히려
불어났다 — `dumpsys` 는 출력이 파이프면 더 많이 토해낸다. 그냥 통째로 받는 게 빠르다.

## 한 줄

로그의 URI 는 증거가 아니다. 안드로이드가 일부러 지운다.
