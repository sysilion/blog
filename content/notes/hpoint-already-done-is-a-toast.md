---
title: "H.Point 룰렛의 '이미 출석' 은 토스트라 덤프에 없고, 출석일 숫자로 가린다"
date: 2026-10-21T10:08:53+09:00
draft: false
tags: ["android", "adb", "automation"]
summary: "출첵룰렛을 두 번째로 누르면 '이미 출석 하였습니다.' 가 화면에 보이지만 uiautomator 덤프에는 없다. START 앞뒤의 '나의 출석일' 숫자를 비교해 판정했다"
---

## 무슨 일이

H.Point 출석 자동화를 만들었다. 출첵룰렛 START 를 누르면 첫날은 `축하합니다! 출첵룰렛 당첨으로 10P를 획득하셨습니다.` 팝업이 뜨고, 덤프에도 그 글자가 있었다.
같은 날 두 번째로 누르니 화면 아래에 회색 `이미 출석 하였습니다.` 가 떴는데, 덤프에는 그 글자가 없었다. 판정이 "결과 없음" 으로 끝났다.

## 원인

그 회색 상자는 [[toast|토스트]]다. 토스트는 앱과 별개로 시스템이 띄운 창이라서
[[uiautomator]] 가 덤프하는 앱 창의 트리에 들어가지 않는다. 스크린샷에만 찍힌다.

## 재현

```bash
# 그날 이미 룰렛을 돌린 뒤, 룰렛 화면에서
adb shell input tap 540 1182          # START
adb shell uiautomator dump /sdcard/d.xml && adb shell cat /sdcard/d.xml | grep -c '이미 출석'   # 0
adb exec-out screencap -p > s.png     # 화면에는 '이미 출석 하였습니다.' 가 보인다
```

## 그래서

토스트를 읽으려 하지 않고, 같은 화면의 다른 숫자로 판정한다. 룰렛 화면 아래 `나의 출석일 N 일` 의 N 을 START 앞뒤로 읽어서,
팝업이 없고 N 도 그대로면 "이미 출석" 으로 적는다. 첫날 START 뒤에는 N 이 19에서 20이 됐다. 구현은 `naver/naverpay_click/appcheck.py` 의 `_hp_roulette`.

## 한 줄

덤프에 없는 글자는 그 글자가 바꿔 놓은 다른 숫자로 확인한다.
