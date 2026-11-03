---
title: "sdl2-compat"
date: 2026-11-04T03:38:08+09:00
draft: false
tags: ["sdl", "library"]
summary: "SDL2 API를 SDL3 위에서 구현한 호환 레이어"
altnames: ["SDL2 compat", "sdl2 compat"]
---

sdl2-compat은 SDL2의 ABI를 그대로 내보내면서 내부에서는 SDL3를 호출하는 호환 라이브러리다.

## 구조

- `libSDL2-2.0.dylib` 라는 이름으로 설치되어, SDL2용으로 빌드한 프로그램이 다시 빌드하지 않고 SDL3 위에서 돈다.
- 실행 시 `libSDL3` 을 찾아 로드한다. SDL3가 없으면 동작하지 않는다.
- Homebrew는 2025년부터 `sdl2` 포뮬러를 sdl2-compat으로 바꿨다 (`brew list --versions` 에 `sdl2-compat` 으로 보인다).

## 알아둘 것

- 동작은 SDL3를 따른다. 이벤트·힌트·신호 처리가 원래 SDL2와 미묘하게 다를 수 있다.
- SDL2 헤더 기준으로 만든 바인딩은 모르는 이벤트 번호를 받을 수 있다. 바인딩이 이를 안전하게 처리하는지 확인해야 한다.
