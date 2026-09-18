---
title: "한영 키가 죽었다 — Karabiner·Hammerspoon·gksdud가 같은 슬롯을 두고 싸우고 있었다"
date: 2026-09-18T17:02:29+09:00
draft: false
tags: ["macos", "keyboard", "karabiner", "hammerspoon", "삽질"]
summary: "macOS 한영 전환은 F18 같은 유령 펑션키를 경유한다. 이걸 거는 도구가 셋이면 마지막 하나만 이긴다."
---

## 무슨 일이

[[gksdud]]를 쓰려고 설치했더니 외장 USB 키보드의 한/영 키가 먹통이 됐다.
내장 키보드의 오른쪽 커맨드는 멀쩡한데 외장만 안 된다.

## 원인

macOS의 "이전 입력 소스 선택" 단축키는 **모디파이어 단독 키를 못 받는다.**
그래서 한영 전환 도구들은 전부 같은 우회로를 쓴다.

```
한영 키 → (어떤 도구가 가로채서) → F18/F19 → 시스템 "이전 입력 소스 선택"
```

F13~F24는 [[hid-usage-id|HID 규격]]에 있지만 물리 키가 없는 유령 키라 충돌 위험이 없다.
그래서 다들 여기로 몰린다. 내 맥에는 이걸 거는 놈이 **셋**이었다.

| 도구 | 매핑 | 수단 |
| --- | --- | --- |
| Karabiner | `right_command → F18` | `simple_modifications` |
| Hammerspoon | `kana → F18` | [[hidutil]] (`foundation_remapping`) |
| gksdud | `right_command → F19` | [[hidutil]] (장치별) |

gksdud가 시스템 단축키를 **F19로 바꿔버렸는데**, Hammerspoon이 걸어둔
`Kana → F18` 은 그대로 살아 있었다. 외장 키보드의 한/영 키는 F18을 쏘고,
받는 사람은 아무도 없다.

## 재현

```bash
$ hidutil property --get "UserKeyMapping"
(
        {
        HIDKeyboardModifierMappingDst = 30064771181;
        HIDKeyboardModifierMappingSrc = 30064771216;
    }
)
```

읽는 법 — `0x700000000`을 빼면 HID usage가 나온다.

```
30064771216 - 30064771072 = 144 = 0x90  → Kana (lang1)
30064771181 - 30064771072 = 109 = 0x6D  → F18
```

시스템 쪽 단축키는 여기 있다. `60`이 "이전 입력 소스 선택"이고,
`parameters` 두 번째 값이 **가상 키코드**다 (F18=79, F19=80).

```bash
/usr/libexec/PlistBuddy -c "Print :AppleSymbolicHotKeys:60" \
  ~/Library/Preferences/com.apple.symbolichotkeys.plist
```

## 걸렸던 것 — gksdud 매핑은 전역 조회에 안 보인다

`hidutil property --get` 에는 Hammerspoon 것만 뜨고 gksdud 매핑은 없었다.
gksdud는 **장치별로** `--matching` 필터를 걸어 등록하기 때문이다.
실제 설정은 여기서 봐야 한다.

```bash
$ defaults read io.gksdud.inputswitch
managedShortcutKeyCode = 80;      # 0x50 = F19
records = {
    4316237946 = { source = 30064771303; target = 30064771182; };
    #              0xE7 = Right Command   0x6E = F19
};
```

## 그래서

**Karabiner가 seize한 장치는 hidutil 매핑보다 먼저 raw 키를 본다.**
그래서 Karabiner에서 변환해 gksdud가 이미 처리 중인 키로 합류시키면 된다.

```json
{ "from": { "key_code": "japanese_kana" }, "to": [{ "key_code": "right_command" }] }
```

외장 한국어 키보드의 한/영 키는 Karabiner EventViewer에 `japanese_kana`
(HID usage `0x90`, lang1)로 잡힌다. 일본어 키가 아니라 그냥 같은 usage를 쓰는 것이다.

```
한/영 키 ─(Karabiner)→ right_command ─(gksdud)→ F19 → 입력 소스 전환
```

Hammerspoon 쪽 `remapper:remap('kana', 'f18')` 은 지웠다.
hidutil 매핑은 메모리에만 있어서 재부팅하면 사라진다.

## 한 줄

한영 전환이 안 되면 `hidutil property --get` 과 `AppleSymbolicHotKeys:60` 의
**양쪽 끝이 같은 F-키를 가리키는지** 먼저 본다.
