---
title: "권한 없으면 패닉하는 크레이트 하나가 앱 전체를 죽였다"
date: 2026-09-16T02:55:29+09:00
draft: false
tags: ["rust", "macos", "tauri"]
summary: "device_query는 손쉬운 사용 권한이 없으면 assert로 패닉한다. panic = abort와 만나 배포본이 켜자마자 꺼졌다."
---

## 무슨 일이

데스크탑 마스코트 앱의 릴리스 빌드를 구워 `.app` 을 띄웠더니 1초 만에
"응용 프로그램이 예기치 않게 종료되었습니다" 가 떴다. 그런데 **같은 바이너리를 터미널에서
직접 실행하면 멀쩡히 돌았다.**

크래시 리포트는 단서가 얇았다. 심볼이 없는 배경 스레드에서 `SIGABRT`:

```
thread 24  Abort trap: 6
  __pthread_kill / pthread_kill / abort
  deskmate ? +6752648
```

## 원인

패닉 메시지는 stderr로만 나가고 크래시 리포트에는 없다. `open` 의 `--stderr` 로 받아 냈다.

```sh
open --stderr /tmp/app.log --stdout /tmp/app.log MyApp.app
```

```
thread '<unnamed>' panicked at device_query-4.0.1/src/device_state/macos/mod.rs:122:9:
This app does not have Accessibility Permissions enabled and will not work
```

`device_query` 의 `DeviceState::new()` 는 손쉬운 사용 권한을 `assert!` 로 확인한다.

```rust
// device_query-4.0.1/src/device_state/macos/mod.rs
pub fn new() -> DeviceState {
    // TODO: remove this
    assert!(
        has_accessibility(),
        "This app does not have Accessibility Permissions enabled and will not work"
    );
    DeviceState {}
}
```

터미널에서 돌 때는 **터미널의 권한을 물려받아** 통과한다. 번들로 띄우면 서명 신원이
달라서 권한이 없고, 거기서 패닉한다. 배경 스레드의 패닉이라 원래는 그 스레드만 죽어야
하는데 `Cargo.toml` 에 [[panic-abort|`panic = "abort"`]] 가 켜져 있어 프로세스 전체가
내려갔다. 같은 이유로 `catch_unwind` 로 감쌀 수도 없다.

**개발 내내 안 보이던 이유가 여기 있다.** 개발에서는 늘 터미널이 부모였다.

## 그래서

같은 크레이트가 확인하는 생성자를 따로 준다. 그리고 기능을 켤 때까지 아예 잡지 않는다.

```rust
let mut device: Option<DeviceState> = None;
...
if device.is_none() {
    device = DeviceState::checked_new();   // Option, assert 없음
    if device.is_none() { continue; }      // 권한 생길 때까지 0으로 둔다
}
```

`checked_new` 는 내부적으로 `AXIsProcessTrustedWithOptions` 에 프롬프트를 켜고 부르므로
촘촘히 부를 것이 못 된다. 30초 간격으로 다시 잡게 했다 — 권한을 준 뒤 앱을 다시 켜야 할
이유가 없다.

## 한 줄

**배포본은 개발자의 터미널 권한을 물려받지 않는다.** 번들을 실제로 열어 보지 않으면
그 차이는 드러나지 않는다.
