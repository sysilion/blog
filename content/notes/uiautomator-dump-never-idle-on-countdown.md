---
title: "화면에 카운트다운이 하나 떠 있으면 uiautomator dump는 영영 실패한다"
date: 2026-09-23T10:40:34+09:00
draft: false
tags: ["android", "adb", "uiautomator"]
summary: "매초 바뀌는 타이머 하나 때문에 덤프가 12초마다 'could not get idle state'로 끝났다. 재시도는 소용없고 애니메이터 배율을 0으로 해도 안 멈췄다"
---

## 무슨 일이

시럽 앱 출석체크 한 번에 264초가 걸렸고, 결과는 실패였다. 홈 화면에 '매일 출석체크'가
멀쩡히 보이는데도 찾지 못했다.

## 원인

[[uiautomator]] 의 `dump` 는 화면이 **idle** 이 될 때까지 기다린 뒤 트리를 뜬다.
홈 오른쪽 아래에 떠 있는 `10분에 1금 07:14` 카운트다운이 매초 다시 그려져서
화면이 끝내 idle 이 되지 않았다. 약 12초 기다린 뒤 파일 없이 끝난다.

코드는 덤프 한 번에 타임아웃 90초, 재시도 4번을 줬고, 여러 단계가 저마다 이걸 불렀다.
실패할 수밖에 없는 12초가 곱해져서 264초가 됐다.

## 재현

```bash
adb shell monkey -p com.skt.skaf.OA00026910 -c android.intent.category.LAUNCHER 1
adb shell 'rm -f /sdcard/w.xml; uiautomator dump /sdcard/w.xml'
# ERROR: could not get idle state.   (약 12초, 몇 번을 떠도 같다)

adb shell settings put global animator_duration_scale 0
adb shell 'rm -f /sdcard/w.xml; uiautomator dump /sdcard/w.xml'
# ERROR: could not get idle state.   (애니메이터를 꺼도 그대로)
adb shell settings put global animator_duration_scale 1.0
```

같은 앱이라도 카운트다운이 없는 화면(뒤로 키를 누르면 뜨는 '앱 종료' 확인창, 출석
페이지 웹뷰)은 3초 만에 정상으로 덤프된다.

## 그래서

- **idle 실패는 재시도하지 않는다.** 한 번 실패하면 몇 번을 떠도 같다. 출력에서
  `idle state` 를 잡아 곧바로 '못 읽는 화면'으로 돌려준다.
- **대기는 횟수가 아니라 시간으로 끊는다.** 덤프를 포함한 모든 대기의 상한을 10초로 뒀다.
- 못 읽는 화면은 건너간다. 뒤로 → '앱 종료' 창의 `계속하기`(이 창은 읽힌다)로 팝업을
  걷고, 진입은 좌표로 누른 뒤 **도착한 액티비티**로 제대로 눌렸는지 확인한다.
  264초 → 38초.

한 줄: 덤프가 idle 실패로 끝나면 느린 게 아니라 **읽을 수 없는 화면**이다. 기다리지 말고 우회한다.
