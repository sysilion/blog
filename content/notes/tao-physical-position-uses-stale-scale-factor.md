---
title: "배율이 다른 모니터로 창을 옮기면 좌표가 절반이 된다"
date: 2026-09-11T15:10:00+09:00
draft: false
tags: ["tauri", "tao", "rust", "multi-monitor", "삽질"]
summary: "tao는 PhysicalPosition을 '창이 지금 올라가 있는 화면'의 배율로 환산한다. 아직 안 옮겨간 창에는 이전 화면의 배율이 쓰인다."
---

## 무슨 일이

모니터마다 그 모니터를 덮는 오버레이 창을 하나씩 띄우는 코드를 썼다.
Retina(배율 2)와 일반 모니터(배율 1)가 같이 물려 있는 환경이다.

```rust
window.set_position(PhysicalPosition::new(area.position.x, area.position.y))?;
window.set_size(PhysicalSize::new(area.size.width, area.size.height))?;
```

주 모니터는 정확히 맞았는데 보조 모니터 쪽 창만 **정확히 절반** 크기로, 절반 좌표에 앉았다.

```
목표: 1920x1080 @ (-223, -1080)
실제:  960x528  @ (-112,  -527)
```

## 원인

[[tao]]의 macOS 구현은 물리 좌표를 논리 좌표로 바꿔서 AppKit에 넘긴다.
그때 쓰는 배율이 **그 창이 지금 올라가 있는 화면의 배율**이다.

```rust
// tao: src/platform_impl/macos/window.rs
fn set_outer_position(&self, position: Position) {
  let dpi = self.scale_factor();      // ← 창의 "현재" 배율
  let position = position.to_logical(dpi);
  ...
}
```

창은 아직 주 모니터(배율 2) 위에 있으므로 `-1080`이 `-540`으로 환산되고,
그 논리 좌표가 배율 1인 보조 모니터에서 그대로 `-540` 물리 픽셀이 된다. 딱 절반.

같은 호출을 연달아 두 번 해도 소용없다. 창이 실제로 옮겨간 뒤의
[[scale-factor|배율]] 변경은 이벤트 루프가 한 바퀴 돌면서 `ScaleFactorChanged`로 통지되는데,
두 번째 호출은 아직 그 전에 처리된다.

## 재현

```rust
for (i, monitor) in app.available_monitors()?.iter().enumerate() {
    let w = WebviewWindowBuilder::new(app, format!("w{i}"), url).build()?;
    w.set_position(PhysicalPosition::new(monitor.position().x, monitor.position().y))?;
    w.set_size(PhysicalSize::new(monitor.size().width, monitor.size().height))?;
}
// 잠시 뒤 outer_position()/outer_size()를 찍어 보면 배율이 다른 쪽만 어긋나 있다
```

`outer_position()`을 호출 직후에 읽어도 소용없다. `set_position`은 이벤트 루프로 메시지를
보내고 바로 반환하는 fire-and-forget이라 **직후의 읽기는 옛날 값을 준다.**

## 그래서

이벤트 루프가 이동을 소화한 뒤 같은 기하를 다시 먹인다.

```rust
for delay in [120, 400, 1200] {
    thread::sleep(Duration::from_millis(delay));
    for label in overlay_labels(&handle) { refit(&handle, &label); }
}
```

`ScaleFactorChanged` 이벤트에도 같은 재적용을 걸어 두면 사용자가 나중에
디스플레이 설정을 바꿔도 따라온다.

## 한 줄

배율이 섞인 멀티 모니터에서 물리 좌표 배치는 **한 번에 끝나지 않는다.** 옮긴 뒤 다시 맞춰야 한다.
