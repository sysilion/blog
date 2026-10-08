---
title: "배너의 깨진 이모지 하나가 uiautomator 덤프를 통째로 죽인다"
date: 2026-10-08T10:05:33+09:00
draft: false
tags: ["android", "adb", "unicode"]
summary: "짝 없는 서로게이트가 화면에 있으면 uiautomator dump 가 Illegal character 로 죽고 빈 파일만 남긴다. 스크롤해서 화면 밖으로 밀면 읽힌다"
---

## 무슨 일이

포켓CU 앱 출석체크가 며칠째 `'출석체크' 를 찾지 못함` 으로 끝났다. 스크린샷에는 홈 한가운데에
`출석체크` 아이콘이 멀쩡히 보였다. 되는 날도 있었다.

## 원인

[[uiautomator]] 덤프가 빈 파일만 남기고 죽고 있었다. 셸에 남는 것은 `Killed` 하나였다.

```
$ adb shell 'uiautomator dump /sdcard/x.xml >/data/local/tmp/o 2>&1; echo rc=$?; cat /data/local/tmp/o'
rc=137
Killed
```

이유는 logcat 에만 있었다.

```
E/AndroidRuntime: java.lang.IllegalArgumentException: Illegal character (U+d83d)
E/AndroidRuntime:   at com.android.org.kxml2.io.KXmlSerializer.reportInvalidCharacter
E/AndroidRuntime:   at com.android.uiautomator.core.AccessibilityNodeInfoDumper.dumpNodeRec
```

홈 배너 문구 `출근은 싫어도 책상은 귀엽게` 끝에 깨진 이모지가 있었다. 화면에서는 `�` 로
보이는 [[surrogate-pair|짝 없는 서로게이트]] `U+D83D` 다. XML 직렬화기가 이 문자를 거부하고,
예외가 프로세스를 통째로 끝낸다. 노드 하나 때문에 화면 전체를 못 읽는다. 배너가 날마다 바뀌어서
되는 날과 안 되는 날이 갈렸다.

## 재현

```bash
adb shell 'uiautomator dump /sdcard/x.xml; ls -l /sdcard/x.xml'   # Killed, 0바이트
adb shell input swipe 540 1800 540 1000 400                       # 배너를 화면 밖으로
adb shell 'uiautomator dump /sdcard/x.xml; grep -c 출석체크 /sdcard/x.xml'   # 53KB, 1
```

## 그래서

종료 코드가 128 이상이면 '죽은 덤프' 로 따로 표시한다. idle 실패와 달리 이 경우는 화면을
밀면 읽힌다. 홈에서 진입 라벨을 찾다가 이 표시를 보면 스와이프하며 다시 찾는다. 바꾼 뒤
포켓CU 가 `출석 완료! 1포인트 지급되었습니다.` 로 끝났다. → `naverpay_click/android.py`

## 한 줄

덤프가 빈 채로 끝나면 화면에 무엇이 있는지부터 의심한다. 글자 하나가 트리 전체를 죽일 수 있다.
