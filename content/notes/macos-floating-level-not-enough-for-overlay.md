---
title: "항상 위로 띄웠는데 터미널이 덮는다"
date: 2026-09-11T16:05:00+09:00
draft: false
tags: ["macos", "appkit", "tauri", "삽질"]
summary: "always_on_top은 NSFloatingWindowLevel(3)이다. 메뉴 막대를 직접 덮는 앱은 그보다 높은 레벨을 쓴다."
---

## 무슨 일이

데스크탑 마스코트를 만들면서 오버레이 창을 `always_on_top(true)`로 띄웠다.
Chrome, Slack 위에서는 잘 보인다. 그런데 iTerm2를 전체화면으로 쓰면 캐릭터가 사라진다.

캐릭터가 죽은 건 아니다. 히트박스는 계속 올라오고 있었다 — 좌표도 화면 안이었다.
그냥 **가려져 있었다.**

## 원인

두 가지가 겹쳤다.

**1. 창 레벨이 낮다.** Tauri의 `always_on_top`은 [[nswindow-level|NSWindow 레벨]]을
`NSFloatingWindowLevel`(3)로 올린다. 그런데 메뉴 막대를 직접 덮는 앱
(iTerm2의 비네이티브 전체화면 등)은 `NSMainMenuWindowLevel`(24) 언저리를 쓴다.
3은 24보다 아래다.

**2. 전체화면 스페이스에 얹히지 않는다.** 다른 앱이 진짜 전체화면 스페이스로 들어가면
`collectionBehavior`에 `fullScreenAuxiliary`가 없는 창은 그 스페이스에 나타나지 않는다.
Tauri의 `set_visible_on_all_workspaces(true)`는 `canJoinAllSpaces`만 켜 준다.

## 그래서

`NSWindow`를 직접 잡아서 둘 다 손봤다.

```rust
use objc2::runtime::AnyObject;

const CAN_JOIN_ALL_SPACES: usize = 1 << 0;
const STATIONARY: usize = 1 << 4;
const FULL_SCREEN_AUXILIARY: usize = 1 << 8;
const POPUP_MENU_WINDOW_LEVEL: isize = 101;

let ns_window = window.ns_window()? as *mut AnyObject;
unsafe {
    let current: usize = objc2::msg_send![ns_window, collectionBehavior];
    let next = current | CAN_JOIN_ALL_SPACES | STATIONARY | FULL_SCREEN_AUXILIARY;
    let _: () = objc2::msg_send![ns_window, setCollectionBehavior: next];
    let _: () = objc2::msg_send![ns_window, setLevel: POPUP_MENU_WINDOW_LEVEL];
}
```

**Tauri의 `set_visible_on_all_workspaces`와 섞어 쓰면 안 된다.**
그쪽은 이벤트 루프로 보내는 비동기 메시지라, 여기서 켠 비트를 나중에 처리되면서 덮어쓴다.
같은 이유로 창을 다시 배치할 때마다 이 설정도 다시 걸어 준다 — 창이 만들어진 직후에는
아직 화면에 올라가지 않아 설정이 먹지 않는 경우가 있다.

## 확인

```
[nswindow] collectionBehavior=0x111 level=101
```

`0x111` = `canJoinAllSpaces | stationary | fullScreenAuxiliary`.

## 한 줄

"항상 위"에는 등급이 있다. 무엇보다 위에 있어야 하는 창이라면 레벨을 직접 정해야 한다.
