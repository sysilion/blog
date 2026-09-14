---
title: "rustup"
date: 2026-09-15T04:13:51+09:00
draft: false
tags: ["rust", "toolchain"]
summary: "Rust 툴체인을 설치하고 전환하는 공식 관리자. 타깃을 추가해도 표준 라이브러리까지만 준다."
altnames: ["rustup target add", "러스트업"]
---

Rust 툴체인(컴파일러·표준 라이브러리·부속 도구)의 설치와 전환을 맡는 공식 도구.

## 무엇인가

- **툴체인**을 여러 벌 깔아 둔다. `stable` `beta` `nightly` 또는 `1.89.0` 같은 특정 버전.
  기본값은 `rustup default`, 디렉터리 단위 고정은 `rust-toolchain.toml` 이다.
- **타깃**을 추가한다. `rustup target add x86_64-pc-windows-msvc`
- **컴포넌트**를 붙인다. `clippy`, `rustfmt`, `rust-src`, `llvm-tools`.
- `~/.cargo/bin` 에 놓이는 `cargo` · `rustc` 는 실제 바이너리가 아니라 **shim** 이다.
  실행되는 순간 위 설정을 보고 어느 툴체인으로 넘길지 정한다.

```sh
$ rustup target list --installed
aarch64-apple-darwin
x86_64-pc-windows-msvc
```

## 알아둘 것

- **`rustup target add` 는 그 타깃의 표준 라이브러리만 준다.** 링커도, C 헤더도, 플랫폼
  SDK도 오지 않는다. 그래서 빌드 스크립트에서 C를 컴파일하는 크레이트(`ring`, `openssl-sys`)가
  섞이면 헤더가 없어 바로 막힌다. 그 간극을 메우는 것이 [[cargo-xwin]] 같은 도구다.
- **Homebrew 의 `rust` 포뮬러에는 rustup 이 없다.** 컴파일러만 들어 있어서 타깃 추가 자체를
  할 수 없다. rustup 을 따로 깔되 셸 설정을 건드리고 싶지 않으면 `--no-modify-path` 로 깔고
  `~/.cargo/bin/rustup` 을 전체 경로로 부른다. 이때 `rustup` 은 `PATH` 에 없는 상태가 된다.
- 두 벌이 섞여 있으면 `which cargo` 가 어느 쪽을 가리키는지가 `PATH` 순서에 달린다.
  이상하면 여기부터 본다.
