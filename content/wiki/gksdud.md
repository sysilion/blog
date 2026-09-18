---
title: "gksdud"
date: 2026-09-18T17:02:29+09:00
draft: false
tags: ["macos", "keyboard", "korean"]
summary: "macOS 한영 전환 유틸. 키를 F19로 매핑하고 눌릴 때 즉시 전환 이벤트를 쏜다."
altnames: ["한영"]
---

**gksdud**는 macOS의 한영 전환 지연과 글자 씹힘을 없애는 메뉴바 유틸이다.
이름은 "한영"을 영문 자판으로 친 것이다. MIT, [codingnoye/gksdud](https://github.com/codingnoye/gksdud).

```bash
brew install --cask codingnoye/tap/gksdud
```

## 어떻게 동작하나

입력 소스나 입력기를 **직접 바꾸지 않는다.** 키 매핑과 전환 이벤트만 쓴다.

```
선택한 한영 키 ─([[hidutil]])→ F19 → 시스템 "이전 입력 소스 선택"
```

"누를 때 전환"을 켜면 키 누름 시점에 F19의 down/up을 연달아 쏜다.
기본 동작이 키를 뗄 때 처리되는 데서 오는 지연이 사라진다.

## 알아둘 것

- **한영 키는 전역으로 하나다**(`TargetKey`). 키보드별로 다른 키를 지정할 수 없고,
  "대상 키보드 설정"은 적용 여부(on/off)만 고른다.
- **매핑을 장치별로 건다.** `hidutil property --get` 에는 안 보인다.
  실제 상태는 `defaults read io.gksdud.inputswitch` 로 본다.

  ```
  managedShortcutKeyCode = 80;   # 0x50 = F19
  originalShortcut = { ... }     # 바꾸기 전 단축키 백업
  records = { ... }              # 장치별 source → target
  ```

- **정상 종료해야 키보드 설정이 복원된다.** 강제 종료하거나 그대로 삭제하면
  hidutil 매핑과 시스템 단축키가 되돌려지지 않는다.
- 자체 서명이라 첫 실행을 Gatekeeper가 막는다. "누를 때 전환"에는 손쉬운 사용 권한이 필요하다.
- [[karabiner-elements|Karabiner]]와 같이 쓰면 키보드 목록에 실제 키보드 대신
  `Karabiner DriverKit VirtualHIDKeyboard` 가 뜬다. 이쪽이 켜져 있어야 동작한다.
