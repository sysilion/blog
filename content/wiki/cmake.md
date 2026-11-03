---
title: "CMake"
date: 2026-11-04T04:00:29+09:00
draft: false
tags: ["build", "c"]
summary: "C/C++ 프로젝트의 빌드 파일을 생성하는 메타 빌드 시스템"
altnames: ["cmake"]
---

CMake는 `CMakeLists.txt` 를 읽어 Make, Ninja, Visual Studio 같은 실제 빌드 도구용 파일을 만들어 내는 메타 빌드 시스템이다.

## 구조

- **설정(configure)**: `cmake -S <소스> -B <빌드>` 로 컴파일러와 의존성을 찾고 빌드 파일을 생성한다. `-G` 로 생성기를 고른다.
- **빌드**: `cmake --build <빌드>` 가 생성된 도구를 호출한다.
- **정책(policy)**: 버전마다 바뀐 동작을 `CMP0xxx` 정책으로 관리한다. `cmake_minimum_required(VERSION x)` 는 "x 버전 시절 동작으로 맞춰 달라"는 선언이기도 하다.

## 알아둘 것

- CMake 4.0에서 3.5 미만 호환 정책이 제거됐다. 오래된 `cmake_minimum_required` 를 가진 프로젝트는 설정 단계에서 실패한다. `CMAKE_POLICY_VERSION_MINIMUM` (캐시 변수 또는 환경 변수)으로 최소 정책 버전을 끌어올려 넘길 수 있다.
- Rust의 `cmake` 크레이트는 `*-sys` 크레이트가 번들 C 소스를 빌드할 때 쓴다. 시스템에 깔린 cmake를 그대로 호출하므로 러너 이미지의 CMake 버전에 영향을 받는다.
