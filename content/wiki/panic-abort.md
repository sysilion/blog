---
title: "panic = abort"
date: 2026-09-16T02:55:29+09:00
draft: false
tags: ["rust"]
summary: "패닉을 되감지 않고 프로세스를 즉시 끝내는 Rust 빌드 설정. 스레드 하나의 패닉이 앱 전체를 죽인다."
altnames: ["panic abort", "패닉 전략", "panic strategy"]
---

패닉이 났을 때 스택을 되감지(unwind) 않고 **프로세스를 그 자리에서 끝내는** Rust 빌드 설정.

## 무엇인가

Rust의 기본 패닉 전략은 `unwind` 다. 패닉이 나면 스택을 거슬러 올라가며 소멸자를 부르고,
**그 스레드만** 죽는다. `std::thread::spawn` 으로 띄운 스레드가 패닉하면 join 할 때
`Err` 로 드러날 뿐, 나머지는 계속 돈다.

`Cargo.toml` 에서 전략을 바꿀 수 있다.

```toml
[profile.release]
panic = "abort"
```

이러면 패닉 핸들러가 곧바로 `abort()` 를 부른다. 되감기 코드가 빠져 바이너리가 작아지고
조금 빨라진다. 그래서 데스크탑 앱 템플릿(Tauri 등)이 흔히 켜 둔다.

## 알아둘 것

- **어느 스레드에서 나든 프로세스 전체가 죽는다.** unwind 였다면 배경 스레드 하나만
  조용히 사라졌을 패닉이, abort 에서는 앱을 통째로 내린다. 배경 스레드에 `unwrap` /
  `expect` / `assert!` 를 두는 비용이 전략에 따라 달라진다.
- `std::panic::catch_unwind` 가 **동작하지 않는다.** 되감을 것이 없으므로 잡을 수도 없다.
  패닉하는 라이브러리를 감싸서 막는 수법을 쓸 수 없다는 뜻이다.
- 죽는 모습은 `SIGABRT` 다. macOS 크래시 리포트에는 `Abort trap: 6` 으로 남고, 스택
  꼭대기는 `__pthread_kill` → `pthread_kill` → `abort` 가 된다. 패닉 메시지 자체는
  리포트에 없고 **stderr로만** 나가므로, 터미널 없이 띄운 앱에서는 아무 단서가 없다.
- 개발 중에는 `dev` 프로필이 그대로 unwind 인 경우가 많다. 그러면 **개발에서는 버티고
  릴리스에서만 죽는** 차이가 생긴다.
