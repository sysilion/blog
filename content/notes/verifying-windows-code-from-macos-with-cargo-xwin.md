---
title: "윈도우 기계 없이 윈도우 전용 코드가 컴파일되는지 확인하기"
date: 2026-09-12T03:55:00+09:00
draft: false
tags: ["rust", "windows", "크로스컴파일", "tauri"]
summary: "cargo-xwin이 MSVC SDK를 받아 와 macOS에서 cargo check를 돌려 준다. cfg로 갈린 파일이 정말 컴파일되는지는 일부러 깨뜨려 확인한다."
---

## 무슨 일이

크로스플랫폼 앱에 `#[cfg(target_os = "windows")]` 로만 들어가는 파일이 하나 있었다.
창 기하를 긁어 오는 코드인데, 윈도우 기계가 없어 **한 번도 컴파일된 적이 없었다.**
README에 "검증 안 됨"이라고 적어 두고 미뤄 왔다.

## 먼저 막힌 것

[[rustup]] 으로 타깃만 추가하면 될 줄 알았다.

```sh
rustup target add x86_64-pc-windows-msvc
cargo check --target x86_64-pc-windows-msvc
```

```
warning: ring@0.17.14: .../check.h:27:11: fatal error: 'assert.h' file not found
error: failed to run custom build command for `ring v0.17.14`
```

`cargo check` 는 링크를 하지 않으니 링커는 필요 없다. 그런데 **C 코드를 빌드 스크립트에서
컴파일하는 크레이트**(여기서는 `ring`)는 그 타깃의 C 헤더가 필요하다. Windows SDK와
MSVC CRT 헤더가 없으니 `assert.h` 부터 막힌다.

Homebrew로 깐 rust에는 애초에 `rustup` 이 없어서 타깃 추가도 못 한다. 이건 rustup을
따로 깔아 우회한다(`--no-modify-path` 로 셸 설정은 건드리지 않는다).

## 그래서 — cargo-xwin

[[cargo-xwin]] 이 Microsoft가 공개한 설치 관리자 매니페스트에서 SDK/CRT 헤더와 임포트
라이브러리를 받아 오고, `clang-cl` 을 MSVC 호환 모드로 물려 준다.

```sh
brew install llvm                 # clang-cl
cargo install cargo-xwin
cd src-tauri && XWIN_ACCEPT_LICENSE=1 \
  cargo xwin check --lib --target x86_64-pc-windows-msvc
```

`ring` 도, `windows` 크레이트도, `webview2-com` 도 전부 통과했다.

```
    Checking windows v0.58.0
    Checking webview2-com v0.38.2
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1m 03s
```

## cfg 파일이 정말 컴파일됐는지는 따로 확인한다

여기가 함정이다. **아무 오류도 안 나는 것과 그 파일이 컴파일된 것은 다르다.**
`cfg` 가 어긋나 파일이 통째로 빠졌어도 빌드는 똑같이 성공한다.

일부러 깨뜨려 본다.

```sh
echo 'const _PROBE: u32 = "not a number";' >> src/surfaces/windows.rs
cargo xwin check --lib --target x86_64-pc-windows-msvc
```

```
error[E0308]: mismatched types
  --> src/surfaces/windows.rs:88:21
```

잡힌다. 이제 "컴파일된다"고 말해도 된다. 확인했으면 되돌린다.

## 한계

**컴파일되는 것과 동작하는 것은 다르다.** `EnumWindows` 로 긁은 좌표가 맞는지, DPI 인지
설정이 먹는지는 여전히 실제 윈도우에서만 알 수 있다. 그래도 오타·시그니처 불일치·
기능 플래그 누락처럼 가장 흔한 실패는 여기서 다 걸린다.

## 한 줄

윈도우가 없어도 `cargo-xwin` 으로 컴파일까지는 확인할 수 있다. 단, 일부러 깨뜨려서
그 파일이 정말 컴파일 대상인지부터 확인하고 시작하라.
