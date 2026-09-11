---
title: "acceptsFirstMouse"
date: 2026-09-11T15:30:00+09:00
draft: false
tags: ["macos", "appkit"]
summary: "비활성 앱의 창을 클릭했을 때 그 클릭을 뷰까지 전달할지 정하는 AppKit 속성."
altnames: ["accept_first_mouse", "acceptsFirstMouse(for:)"]
---

**acceptsFirstMouse**는 `NSView`의 속성이다. 앱이 비활성 상태일 때 들어온 첫 마우스 클릭을
뷰가 받을지 결정한다.

기본값은 `false`다. 그래서 배경 앱의 창을 클릭하면 첫 클릭은 **앱을 활성화하는 데 소비되고**
뷰까지 오지 않는다. 사용자는 두 번 눌러야 한다.

```swift
override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
```

Tauri v2에서는 창 빌더의 `.accept_first_mouse(true)`로 켠다.

## 알아둘 것

포커스를 절대 가져가면 안 되는 창(데스크탑 마스코트, HUD, 플로팅 팔레트)은 앱이 계속
비활성이라 **모든 클릭이 첫 클릭**이 된다. 이 속성을 켜지 않으면 클릭이 전혀 먹지 않는 것처럼 보인다.

왼쪽 버튼에 대한 이야기다. 오른쪽 클릭은 비활성 상태에서 웹뷰까지 오지 않을 수 있으니,
컨텍스트 메뉴는 `contextmenu` 이벤트 대신 `mousedown`의 `button === 2`로 여는 편이 안전하다.
