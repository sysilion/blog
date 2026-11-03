---
title: "sdl2 0.37 크레이트는 모르는 이벤트 번호를 받으면 패닉한다"
date: 2026-11-04T03:38:08+09:00
draft: false
tags: ["rust", "sdl"]
summary: "Homebrew sdl2-compat 위에서 비디오를 켜자 0x404 이벤트로 이벤트 루프가 죽었다. 0.38로 올리면 해결"
---

## 무슨 일이

padpilot에서 화상 키보드용으로 `sdl.video()` 를 켜자 실행 직후 죽었다. 비디오를 켜기 전에는 멀쩡했다.

```
panicked at sdl2-0.37.0/src/sdl2/event.rs:336:27:
trying to construct an enum from an invalid value 0x404
thread caused non-unwinding panic. aborting.
```

## 원인

0.37의 `EventType::try_from(u32)` 는 숫자를 `transmute` 로 바로 `SDL_EventType` enum에 넣는다. 0x404(1028)는 바인딩에 없는 값이다(`SDL_MOUSEWHEEL` = 1027이 마지막). 디버그 빌드의 유효성 검사가 이걸 잡아 패닉시켰다. Homebrew의 `sdl2` 는 [[sdl2-compat]] 이라서, 실제 라이브러리가 2.x 헤더에 없는 이벤트를 넘길 수 있다.

0.38은 `match n { x if x == ... }` 로 비교하고, 모르는 번호는 `EventType::User` 로 돌린다.

## 재현

```bash
brew install sdl2            # sdl2-compat 2.32.x
# Cargo.toml: sdl2 = "0.37"
# sdl.video() 를 켠 뒤 event_pump.poll_iter() 를 돌리고 마우스를 움직이면 패닉
grep -n "transmute(n)" ~/.cargo/registry/src/*/sdl2-0.37.0/src/sdl2/event.rs
```

## 그래서

`sdl2 = "0.38"` 로 올렸다. API 변경 없이 빌드됐고 패닉도 사라졌다.

## 한 줄

Homebrew SDL2 위에서 Rust `sdl2` 를 쓸 땐 0.38 이상을 쓴다. "invalid value 0x..." 패닉이 보이면 버전부터 확인한다.
