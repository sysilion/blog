---
title: "hidutil"
date: 2026-09-18T17:02:29+09:00
draft: false
tags: ["macos", "keyboard", "hid"]
summary: "macOS 기본 제공 HID 키 리매핑 CLI. 시스템 설정의 '보조 키' 와 같은 계층이다."
altnames: ["UserKeyMapping"]
---

**hidutil**은 macOS에 기본 포함된 HID 장치 제어 CLI다.
`UserKeyMapping` 속성으로 커널 레벨에서 키를 바꿔치기할 수 있다.
Apple의 Technical Note TN2450에서 공식화됐다.

## 쓰는 법

```bash
# 조회
hidutil property --get "UserKeyMapping"

# 설정 (Caps Lock → Escape)
hidutil property --set '{"UserKeyMapping":[
  {"HIDKeyboardModifierMappingSrc":0x700000039,
   "HIDKeyboardModifierMappingDst":0x700000029}
]}'

# 해제
hidutil property --set '{"UserKeyMapping":[]}'
```

## 값 읽는 법

`0x700000000` 이 [[hid-usage-id|HID usage page]] 7(키보드)을 뜻하는 접두사다.
하위 바이트가 usage ID다.

```
30064771216 - 0x700000000 = 0x90  → Kana (lang1)
30064771181 - 0x700000000 = 0x6D  → F18
```

`defaults read` 로 나오는 10진수를 볼 일이 많으니 `0x700000000 = 30064771072` 는
외워두면 편하다.

## 알아둘 것

- **재부팅하면 사라진다.** 영구 적용하려면 LaunchAgent로 로그인 시마다 실행해야 한다.
- **`--matching` 으로 장치를 한정할 수 있다.** 이때 등록한 매핑은 필터 없는
  `--get` 에 **안 보인다.** 장치별로 거는 도구([[gksdud]] 등)를 쓰면 조회 결과가
  비어 보여도 매핑이 살아 있을 수 있다.
- **슬롯이 하나다.** 여러 도구가 각자 `--set` 하면 마지막 하나가 앞의 것을 통째로 덮어쓴다.
  Hammerspoon `foundation_remapping`, [[gksdud]], 시스템 설정의 '보조 키' 가 전부 여기를 쓴다.
- **[[karabiner-elements|Karabiner]]는 이 계층을 쓰지 않는다.** 장치를 seize 해서
  raw 이벤트를 먼저 보고 가상 HID 키보드로 재발행하므로, hidutil 매핑보다 앞선다.
