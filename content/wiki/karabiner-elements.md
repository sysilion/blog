---
title: "Karabiner-Elements"
date: 2026-09-18T17:02:29+09:00
draft: false
tags: ["macos", "keyboard"]
summary: "macOS 키보드 리매퍼. 장치를 seize 해 raw 이벤트를 먼저 보고 가상 키보드로 재발행한다."
altnames: ["Karabiner"]
---

**Karabiner-Elements**는 macOS용 키보드 커스터마이저다.
DriverKit 가상 HID 장치를 써서 동작한다.

## 어떻게 동작하나

물리 키보드를 **seize**(독점)해서 raw HID 이벤트를 직접 받고,
규칙을 적용한 결과를 `Karabiner DriverKit VirtualHIDKeyboard` 로 재발행한다.

```
물리 키보드 → Karabiner(seize) → 규칙 적용 → 가상 HID 키보드 → 앱
```

이 때문에 **[[hidutil]] 매핑이나 시스템 설정의 '보조 키' 보다 앞선다.**
Karabiner는 원래 키를 보고, 그 뒤에 hidutil 매핑이 가상 키보드에 적용된다.
두 도구를 체인으로 엮을 수 있다는 뜻이기도 하다.

## 설정

`~/.config/karabiner/karabiner.json` 하나다. 저장하면 즉시 반영된다.

- `simple_modifications` — 키 1:1 치환. 조건 없음.
- `complex_modifications` — 조건·동시입력·홀드 등. `manipulators` 배열.

```json
{ "from": { "key_code": "japanese_kana" }, "to": [{ "key_code": "right_command" }] }
```

## 알아둘 것

- **EventViewer**로 실제 key_code를 확인할 수 있다. 한국어 키보드의 한/영 키는
  `japanese_kana` ([[hid-usage-id|HID usage]] `0x90`, lang1)로 잡힌다.
  일본어 전용 키가 아니라 같은 usage를 공유하는 것이다.
- 설정 파일을 손으로 고칠 때 Karabiner가 되받아 쓸 수 있으니 앱 종료 후 편집이 안전하다.
- `automatic_backups/` 에 변경 이력이 남는다.
