---
title: "cargo-xwin"
date: 2026-09-12T03:55:00+09:00
draft: false
tags: ["rust", "windows", "크로스컴파일"]
summary: "리눅스·macOS에서 Windows MSVC 타깃으로 Rust를 빌드하게 해 주는 cargo 하위 명령."
altnames: ["xwin"]
---

`x86_64-pc-windows-msvc` 타깃을 **윈도우 기계 없이** 빌드·검사하게 해 주는 cargo 하위 명령.

## 무엇인가

MSVC 타깃은 Windows SDK 헤더와 MSVC CRT, 그리고 임포트 라이브러리가 있어야 한다.
`rustup target add` 는 Rust 표준 라이브러리만 준다. 그래서 C를 컴파일하는 빌드 스크립트
(`ring`, `openssl-sys` 등)를 가진 크레이트에서 바로 막힌다.

`cargo-xwin` 은 내부적으로 [xwin](https://github.com/Jake-Shadle/xwin)을 써서
Microsoft가 공개한 Visual Studio 설치 매니페스트에서 헤더와 라이브러리를 받아 캐시하고,
`CC`/`AR`/링커를 `clang-cl`·`llvm-lib`·`lld-link` 로 맞춰 준다.

```sh
cargo install cargo-xwin
XWIN_ACCEPT_LICENSE=1 cargo xwin check  --target x86_64-pc-windows-msvc
XWIN_ACCEPT_LICENSE=1 cargo xwin build  --target x86_64-pc-windows-msvc --release
```

## 알아둘 것

- **`clang-cl` 이 필요하다.** macOS면 `brew install llvm` 후 그 `bin` 을 PATH에 올린다.
  Apple 기본 clang에는 `clang-cl` 심볼릭 링크가 없다.
- `XWIN_ACCEPT_LICENSE=1` 은 Microsoft 배포 라이선스에 동의한다는 뜻이다. 내려받는 것은
  헤더와 임포트 라이브러리이고, 재배포 조건은 그 라이선스를 따른다.
- SDK 캐시는 한 번 받으면 재사용된다(수백 MB).
- `check` 는 링크를 하지 않아 가장 가볍고, 타입·시그니처·기능 플래그 문제를 거의 다 잡는다.
- **컴파일 검증일 뿐 동작 검증이 아니다.** 그리고 `cfg` 로 갈린 파일이 실제로 컴파일
  대상인지는 일부러 오류를 심어 확인해야 한다. → [[verifying-windows-code-from-macos-with-cargo-xwin]]
