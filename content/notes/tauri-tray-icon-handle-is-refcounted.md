---
title: "트레이 아이콘을 만들었는데 메뉴 막대에 아무것도 없다"
date: 2026-09-11T16:40:00+09:00
draft: false
tags: ["tauri", "rust", "macos", "삽질"]
summary: "TrayIcon은 참조 카운트다. build()가 돌려준 핸들을 버리면 아이콘도 같이 사라진다."
---

## 무슨 일이

[[tauri|Tauri]] v2로 메뉴 막대 아이콘을 붙였다. 흔한 모양대로 썼다.

```rust
fn build(app: &AppHandle) -> tauri::Result<()> {
    TrayIconBuilder::with_id("deskmate")
        .icon(tauri::image::Image::from_bytes(TRAY_ICON)?)
        .menu(&menu)
        .on_menu_event(handle)
        .build(app)?;      // ← 반환값을 버린다
    Ok(())
}
```

`build()`는 `Ok`를 준다. 오류 로그도 없다. 그런데 메뉴 막대에는 아무것도 없다.

아이콘을 의심해서 전용 모노크롬 실루엣을 새로 구워 봤다. 그대로다.
`.title("DM")`로 글자를 붙여 봤다. 글자도 안 나온다.

## 원인

Tauri 소스의 `TrayIcon` 문서 주석에 한 줄로 적혀 있다.

> This type is reference-counted and the icon is removed when the last instance is dropped.

`build()`가 돌려주는 `TrayIcon`이 **아이콘의 수명 그 자체**다. `?` 뒤에 세미콜론을 찍는 순간
핸들이 떨어지고, 아이콘도 같이 사라진다. 생성은 분명히 성공했으므로 `Ok`가 나오는 것도 맞다.

## 재현

```rust
// 안 보인다
TrayIconBuilder::new().icon(icon).build(app)?;

// 보인다
let tray = TrayIconBuilder::new().icon(icon).build(app)?;
std::mem::forget(tray);   // 또는 어딘가에 저장
```

## 그래서

앱 상태에 붙잡아 둔다. 설정에서 껐다 켜야 하므로 `Option`으로 감쌌다.

```rust
#[derive(Default)]
pub struct TrayHandle(Mutex<Option<TrayIcon>>);

// 끄기
*handle.0.lock().unwrap() = None;

// 켜기
*handle.0.lock().unwrap() = Some(build(app)?);
```

`None`을 넣는 것만으로 아이콘이 사라진다. 지우는 API를 따로 부를 필요가 없다.

## 곁다리 — 아이콘이 안 보이는 다른 이유

이번 건과 별개로, **모니터가 여러 대면 상태 항목이 다른 화면의 메뉴 막대에 붙는다.**
주 화면만 캡처하면 없는 것처럼 보인다. 실제로 있는지는 접근성 API로 확인하는 게 확실하다.

```bash
osascript -e 'tell application "System Events" to tell process "deskmate" \
  to get {position, size} of menu bar item 1 of menu bar 2'
# 711, -1148, 52, 24    ← y가 음수면 위쪽 모니터에 붙어 있다는 뜻
```

## 한 줄

`build()`의 반환값을 버리지 마라. 그 핸들이 아이콘의 수명이다.
