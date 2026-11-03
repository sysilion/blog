---
title: "CMake 4는 cmake_minimum_required 3.5 미만 프로젝트를 거부한다"
date: 2026-11-04T04:00:29+09:00
draft: false
tags: ["cmake", "rust", "ci"]
summary: "sdl2-sys 의 bundled 빌드가 GitHub Actions Windows 러너에서 CMake 4 때문에 깨졌다. CMAKE_POLICY_VERSION_MINIMUM 환경 변수로 넘겼다"
---

## 무슨 일이

padpilot을 GitHub Actions의 `windows-latest` 에서 `cargo build --features bundled` 로 빌드하자 `sdl2-sys v0.38.0` 의 빌드 스크립트가 실패했다. macOS·Linux는 시스템 SDL2를 링크하므로 영향이 없었다.

```
CMake Error at CMakeLists.txt:5 (cmake_minimum_required):
  Compatibility with CMake < 3.5 has been removed from CMake.
  ...
  Or, add -DCMAKE_POLICY_VERSION_MINIMUM=3.5 to try configuring anyway.
```

## 원인

`bundled` 기능은 크레이트에 들어 있는 SDL 소스를 [[cmake]] 로 빌드한다. 그 `CMakeLists.txt` 가 3.5보다 낮은 최소 버전을 선언한다. 러너의 CMake가 4.x로 올라가면서 3.5 미만 호환 정책이 아예 빠졌고, 설정 단계에서 바로 멈췄다. 크레이트 코드는 그대로인데 러너 이미지가 바뀌어서 깨지는 종류다.

## 재현

```bash
cmake --version                 # 4.x
cargo build --features bundled  # sdl2 = "0.38", features = ["bundled"]
```

## 그래서

CMake 4는 `CMAKE_POLICY_VERSION_MINIMUM` 을 환경 변수로도 읽는다. cmake 크레이트가 자식 프로세스에 환경을 넘기므로 저장소의 `.cargo/config.toml` 에 넣으면 CI와 로컬 Windows 빌드에 같이 적용된다.

```toml
[env]
CMAKE_POLICY_VERSION_MINIMUM = "3.5"
```

다음 CI에서 `sdl2-sys` 빌드를 통과했다.

## 한 줄

C 소스를 번들로 빌드하는 `*-sys` 크레이트가 "Compatibility with CMake < 3.5" 로 죽으면 `.cargo/config.toml` 의 `[env]` 에 `CMAKE_POLICY_VERSION_MINIMUM = "3.5"` 를 넣는다.
