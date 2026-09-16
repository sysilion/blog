---
title: "adb"
date: 2026-09-16T13:18:00+09:00
draft: false
tags: ["android"]
summary: "안드로이드 기기를 호스트에서 조작하는 디버그 브리지"
altnames: ["Android Debug Bridge"]
---

호스트와 안드로이드 기기 사이의 디버그 통로다. USB 또는 TCP 로 붙어 셸 실행, 파일
전송, 앱 설치, 화면 캡처, 설정 변경을 한다.

## 무엇인가

`adb devices` 에 올라온 시리얼을 `-s` 로 지목해 명령을 보낸다. 기기가 둘 이상이면
지목하지 않은 명령은 `more than one device` 로 거부된다.

| 명령 | 하는 일 |
| --- | --- |
| `adb shell <cmd>` | 기기에서 셸 명령 |
| `adb exec-out <cmd>` | 위와 같으나 출력이 이진 안전 (`screencap -p` 등) |
| `adb shell settings put global <k> <v>` | 전역 설정 변경 → [[android-global-proxy]] |
| `adb shell uiautomator dump` | 화면의 접근성 트리를 XML 로 |
| `adb shell getevent` | 원시 입력 이벤트 → [[getevent]] |

무선 디버깅은 `adb pair` 로 한 번 짝을 맺고 `adb connect <ip>:<port>` 로 붙는다.
**포트는 재부팅·네트워크 변경마다 바뀐다.**

## 알아둘 것

- **`adb shell` 은 uid 0 또는 2000 으로 돈다.** 일반 앱과 네트워크 경로·권한이 다르다.
  `adb shell curl` 이 200 을 받았다고 앱이 인터넷을 쓴다는 증거가 되지 않는다.
- **`exec-out` 이 아니면 출력이 텍스트로 변환된다.** 이진 데이터는 깨진다.
- 로컬 adb 클라이언트를 죽여도 기기 쪽 프로세스는 남을 수 있다. 읽기에서 블록된
  `logcat` 이 대표적이다.
