---
title: "NSWindow 레벨"
date: 2026-09-11T16:05:00+09:00
draft: false
tags: ["macos", "appkit"]
summary: "macOS 창의 z-순서 등급. 값이 클수록 위에 그려진다."
altnames: ["window level", "NSWindowLevel", "창 레벨", "setLevel"]
---

**창 레벨**은 macOS가 창을 겹쳐 그릴 때 쓰는 등급이다. 값이 큰 창이 위에 온다.
같은 레벨 안에서는 활성화 순서가 결정한다.

## 주요 값

| 상수 | 값 | 쓰임 |
| --- | --- | --- |
| `NSNormalWindowLevel` | 0 | 보통 앱 창 |
| `NSFloatingWindowLevel` | 3 | 도구 팔레트. Tauri `always_on_top`이 쓰는 값 |
| `NSModalPanelWindowLevel` | 8 | 모달 패널 |
| `NSMainMenuWindowLevel` | 24 | 메뉴 막대 |
| `NSStatusWindowLevel` | 25 | 상태 항목 |
| `NSPopUpMenuWindowLevel` | 101 | 팝업 메뉴 |
| `NSScreenSaverWindowLevel` | 1000 | 화면 보호기 |

## 알아둘 것

"항상 위"라고 다 같은 위가 아니다. `NSFloatingWindowLevel`(3)은 메뉴 막대(24)보다 아래라,
메뉴 막대를 직접 덮는 앱의 창에 가려진다.

전체화면 스페이스 위에 뜨는 건 레벨과 **별개 문제**다. 그건 `collectionBehavior`의
`fullScreenAuxiliary` 비트가 결정한다. 둘 다 필요하다.
[[work-area|작업 영역]]에 맞춘 창이라면 레벨을 올려도 메뉴 막대를 시각적으로 덮지 않는다.
