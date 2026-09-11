---
title: "비활성 앱의 창은 첫 클릭을 삼킨다"
date: 2026-09-11T15:30:00+09:00
draft: false
tags: ["macos", "tauri", "appkit", "삽질"]
summary: "macOS는 배경 앱의 첫 클릭을 '앱 활성화'로 소비한다. acceptsFirstMouse를 켜야 웹뷰까지 간다."
---

## 무슨 일이

항상 위에 떠 있는 오버레이 창 안의 캐릭터를 마우스로 집어 드는 기능을 만들었다.
커서가 캐릭터 위에 있을 때만 클릭 통과를 풀어 주는 것까지는 됐는데,
정작 눌러도 웹뷰의 `mousedown` 핸들러가 돌지 않았다.

창은 분명히 클릭을 받을 수 있는 상태였다. 그런데 이벤트가 안 온다.

## 원인

macOS는 **비활성 앱**의 창을 클릭하면 그 클릭을 "앱 활성화"에 써 버린다.
뷰까지 전달하지 않는다. 이 동작을 끄는 것이 [[accepts-first-mouse|acceptsFirstMouse]]다.

오버레이는 절대 포커스를 뺏으면 안 되는 창이라(`.focused(false)`) 앱이 항상 비활성이었고,
그래서 **모든** 클릭이 첫 클릭이었다.

## 재현

```rust
// 이벤트가 안 온다
WebviewWindowBuilder::new(app, "overlay", url)
    .always_on_top(true)
    .focused(false)
    .build()?;

// 온다
WebviewWindowBuilder::new(app, "overlay", url)
    .always_on_top(true)
    .focused(false)
    .accept_first_mouse(true)   // ← 이것
    .build()?;
```

## 그래서

데스크탑 마스코트, HUD, 플로팅 팔레트처럼 **포커스를 안 가져가면서 클릭은 받아야 하는 창**은
`accept_first_mouse`가 사실상 필수다.

다만 이건 왼쪽 버튼 이야기다. 오른쪽 클릭은 앱이 비활성인 동안 웹뷰까지 오지 않을 수 있어서,
컨텍스트 메뉴를 `contextmenu` 이벤트가 아니라 `mousedown`의 `button === 2`로 여는 편이 안전하다.

## 한 줄

`acceptsFirstMouse`를 안 켜면 배경 앱의 창은 클릭을 한 번씩 버린다. 포커스를 안 받는 창이라면 매번 버린다.
