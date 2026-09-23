---
title: "uiautomator"
date: 2026-09-16T15:10:00+09:00
draft: false
tags: ["android", "adb", "testing"]
summary: "안드로이드 화면의 접근성 트리를 XML로 덤프해 주는 도구. 좌표 대신 텍스트로 요소를 지목할 수 있게 한다"
altnames: ["uiautomator dump", "accessibility tree"]
---

안드로이드 기기의 현재 화면을 **접근성 트리**로 읽어 XML 로 내보내는 도구다.
자동화가 좌표가 아니라 요소를 다룰 수 있게 해 준다.

## 무엇인가

```bash
adb shell uiautomator dump /sdcard/window_dump.xml
adb shell cat /sdcard/window_dump.xml
```

노드 하나가 화면의 요소 하나다. 쓸모 있는 속성은 이렇다.

| 속성 | 뜻 |
| --- | --- |
| `text` | 화면에 보이는 글자 |
| `content-desc` | 스크린리더용 설명. 이미지 버튼은 여기에만 이름이 있다 |
| `resource-id` | `com.example:id/btn_ok` 형태의 안정적인 식별자 |
| `bounds` | `[x1,y1][x2,y2]` 화면 좌표 |
| `clickable` | 누를 수 있는가 |

## 알아둘 것

- **화면 전환 중에는 `null root node` 로 실패한다.** 실패를 '요소 없음' 으로 읽지 말고
  다시 떠야 한다.
- **덤프는 화면이 idle 이 될 때까지 기다린다.** 계속 다시 그려지는 요소(타이머, GIF)가
  하나라도 있으면 약 12초 뒤 `could not get idle state` 로 끝나고, 다시 떠도 같다.
  `animator_duration_scale 0` 으로도 막히지 않는 경우가 있다.
  → [[uiautomator-dump-never-idle-on-countdown]]
- **WebView 의 내용은 늦게 채워진다.** 자식 없는 WebView 노드가 나오면 아직 준비되지
  않은 것이다. → [[webview-accessibility-tree-arrives-late]]
- **WebView 는 자식들의 텍스트를 부모에 합쳐 놓는다.** 텍스트로 찾을 때 후보가
  여럿이면 **라벨이 가장 짧은 것**이 대개 그 버튼 자신이다. 긴 쪽은 화면 절반을 감싼
  컨테이너라 그 중심을 누르면 엉뚱한 곳이 눌린다.
- **부분 일치는 위험하다.** `닫기` 로 찾으면 `레이어 닫기` 가 걸린다. 짧고 흔한 라벨은
  거부 목록을 같이 둬야 한다.
- 비ASCII 문자가 `&#128077;` 같은 수치 참조로 나올 수 있다. 화면 글자와 비교하려면
  이스케이프를 풀어야 한다.
