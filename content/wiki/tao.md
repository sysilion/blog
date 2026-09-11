---
title: "tao"
date: 2026-09-11T15:10:00+09:00
draft: false
tags: ["rust", "gui", "tauri"]
summary: "Tauri가 쓰는 Rust 크로스플랫폼 창 생성 라이브러리. winit의 포크다."
altnames: ["tao-rs"]
---

**tao**는 [[tauri]]가 창과 이벤트 루프를 다루는 데 쓰는 Rust 라이브러리다.
[winit](https://github.com/rust-windowing/winit)에서 갈라져 나왔고, 메뉴·트레이·
GTK 통합처럼 데스크탑 앱에 필요한 기능이 winit보다 더 들어 있다.

## 구조

플랫폼별 구현이 `src/platform_impl/` 아래에 따로 있다 — macOS는 AppKit,
Windows는 Win32, Linux는 GTK. Tauri는 `tauri-runtime-wry`를 통해 tao(창)와
wry(웹뷰)를 묶는다.

## 알아둘 것

창 조작 API는 대부분 **이벤트 루프로 메시지를 보내고 바로 반환한다.**
`set_position` 직후에 `outer_position`을 읽으면 이전 값이 나온다.

물리 좌표(`PhysicalPosition`/`PhysicalSize`)는 내부적으로 논리 좌표로 환산되는데,
그때 쓰는 [[scale-factor|배율]]이 **창이 지금 올라가 있는 화면**의 것이다.
배율이 다른 모니터로 창을 옮기는 순간에는 이 값이 아직 이전 화면 것이라 좌표가 어긋난다.
