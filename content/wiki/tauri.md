---
title: "Tauri"
date: 2026-09-11T15:10:00+09:00
draft: false
tags: ["rust", "desktop", "gui"]
summary: "Rust 백엔드 + OS 내장 웹뷰로 데스크탑 앱을 만드는 프레임워크. Electron의 경량 대안."
altnames: ["tauri-apps"]
---

**Tauri**는 Rust로 백엔드를 쓰고 화면은 **OS에 이미 깔린 웹뷰**로 그리는 데스크탑 앱 프레임워크다.
크로미움을 통째로 번들하는 Electron과 달리 런타임을 들고 다니지 않아서, 바이너리와
메모리 사용량이 크게 작다.

## 구성

| 조각 | 역할 |
| --- | --- |
| [[tao]] | 창과 이벤트 루프 |
| wry | 웹뷰 래퍼 (WKWebView / WebView2 / WebKitGTK) |
| `#[tauri::command]` | 프론트엔드에서 부를 수 있는 Rust 함수 |
| capabilities | 창별로 허용할 권한 목록 |

## 알아둘 것

v2부터 권한이 `capabilities/*.json`으로 분리됐다. 창 라벨 목록과 허용 권한을 여기 적어야
프론트엔드에서 코어 API를 부를 수 있다. 라벨에 와일드카드(`overlay-*`)를 쓸 수 있다.

macOS에서 투명 창을 쓰려면 `tauri.conf.json`의 `app.macOSPrivateApi`와
Cargo 기능 `macos-private-api`를 둘 다 켜야 한다. 한쪽만 켜면 빌드가 막힌다.

창 조작 API는 대부분 비동기 메시지라 **호출 직후에 읽으면 옛날 값이 나온다.**

`TrayIconBuilder::build()`가 돌려주는 `TrayIcon`은 참조 카운트다. 반환값을 버리면
아이콘도 같이 사라진다 — 생성은 성공하고 `Ok`가 나오므로 알아채기 어렵다.
