---
title: "한영 전환을 Karabiner 에서 gksdud 로 옮기기"
date: 2026-09-18T17:05:00+09:00
draft: false
tags: ["macos", "keyboard", "karabiner", "hammerspoon", "한영전환"]
summary: "macOS 한영 전환은 F18 같은 유령 펑션키를 경유한다. 이걸 거는 도구가 셋이면 마지막 하나만 이긴다. 충돌을 정리하고 외장 키보드까지 살리는 과정."
---

macOS 에서 한영 전환을 제대로 쓰려면 결국 뭔가를 깔게 된다. 오른쪽 커맨드를 한영 키로 쓰고 싶은데
기본 설정으로는 안 되기 때문이다. 나는 [[karabiner-elements|Karabiner]] 로 그걸 해왔고,
[[gksdud]] 라는 전용 유틸을 발견해서 옮겼다.

옮기는 김에 알게 된 게 있다. **내 맥에는 한영 전환을 거는 놈이 셋이었다.**
서로 같은 자리를 두고 싸우고 있었는데 그동안 우연히 동작하고 있었을 뿐이다.

## 왜 유령 키를 경유하는가

먼저 이 바닥의 전제를 알아야 한다. macOS 의 "이전 입력 소스 선택" 단축키는
**모디파이어 단독 키를 받지 못한다.** 오른쪽 커맨드를 그냥 등록할 수가 없다.

그래서 한영 전환 도구들은 전부 같은 우회로를 쓴다.

```
한영 키 → (도구가 가로채서) → F18 → 시스템 "이전 입력 소스 선택"
```

왜 하필 F18인가. [[hid-usage-id|HID 규격]]에는 F1부터 **F24까지** 정의돼 있는데,
맥북에는 F12까지밖에 없다. F13~F24 는 번호는 있지만 누를 방법이 없는 유령 키다.

| 키 | HID usage | 물리 키 |
| --- | --- | --- |
| F12 | `0x45` | 있음 |
| F13~F19 | `0x68`~`0x6E` | 없음 |
| F20~F24 | `0x6F`~`0x73` | 없음 |

아무도 안 쓰니 다른 앱 단축키와 겹칠 일이 없고, 실수로 눌릴 일도 없다.
그래서 리매핑의 중계 지점으로 다들 여기로 몰린다.

## 내 맥의 상태

옮기기 전에 현황을 확인했더니 이랬다.

**Karabiner** — `~/.config/karabiner/karabiner.json`

```json
{ "from": { "key_code": "right_command" }, "to": [{ "key_code": "f18" }] }
```

**Hammerspoon** — `~/.hammerspoon/init.lua`

```lua
local FRemap = require('foundation_remapping')
local remapper = FRemap.new()
remapper:remap('kana', 'f18')
remapper:register()
```

**시스템** — "이전 입력 소스 선택" 이 F18

```bash
$ /usr/libexec/PlistBuddy -c "Print :AppleSymbolicHotKeys:60" \
    ~/Library/Preferences/com.apple.symbolichotkeys.plist
Dict {
    enabled = true
    value = Dict {
        type = standard
        parameters = Array {
            65535
            79          ← 가상 키코드 79 = F18
            8388608
        }
    }
}
```

경로가 둘이었다. 내장 키보드는 오른쪽 커맨드로(Karabiner), 외장 키보드는 한/영 키로(Hammerspoon).
양쪽 다 F18 로 모이고, 시스템이 F18 을 받아 전환한다.

```
오른쪽 커맨드 ──(Karabiner)──┐
                            ├──> F18 ──> 입력 소스 전환
한/영 키 ──(Hammerspoon)────┘
```

이게 잘 굴러갔던 이유는 **셋이 같은 F18 을 가리키고 있었기 때문**이다.
하나라도 어긋나는 순간 무너진다.

## hidutil 값 읽는 법

Hammerspoon 의 `foundation_remapping` 은 내부적으로 [[hidutil]] 을 호출한다.
현재 상태는 이렇게 본다.

```bash
$ hidutil property --get "UserKeyMapping"
(
        {
        HIDKeyboardModifierMappingDst = 30064771181;
        HIDKeyboardModifierMappingSrc = 30064771216;
    }
)
```

10진수라 그대로는 못 읽는다. `0x700000000`(= `30064771072`)이 HID usage page 7(키보드)
접두사이므로 이걸 빼면 usage ID 가 나온다.

```
Src: 30064771216 - 30064771072 = 144 = 0x90  → Kana (lang1)
Dst: 30064771181 - 30064771072 = 109 = 0x6D  → F18
```

`Kana → F18`. Hammerspoon 이 건 그것이다.

여기서 한 번 헷갈렸다. **hidutil 은 HID usage 를 쓰고, `AppleSymbolicHotKeys` 는
macOS 가상 키코드를 쓴다.** 같은 F18 이 한쪽에선 `0x6D`, 다른 쪽에선 `79`(`0x4F`)다.
두 숫자를 나란히 놓고 보면 전혀 달라 보이는데 같은 키다.

## gksdud 로 옮기기

[[gksdud]] 도 원리는 같다. 다만 기본 중계 키가 **F19** 이고, "누를 때 전환" 을 켜면
키를 누른 시점에 F19 의 down/up 을 연달아 쏜다. 기본 동작이 키를 뗄 때 처리되는 데서 오는
지연과 글자 씹힘이 여기서 사라진다.

```bash
brew install --cask codingnoye/tap/gksdud
```

문제는 **셋 다 살려두면 안 된다**는 것이다. gksdud 는 hidutil 의 `UserKeyMapping` 을 쓰는데,
Hammerspoon 도 같은 자리를 쓴다. 슬롯은 하나다. 나중에 `--set` 한 쪽이 앞의 것을 통째로 덮어쓴다.

Karabiner 는 사정이 다르다. 이쪽은 hidutil 을 안 쓰고, 장치를 **seize** 해서 raw HID 이벤트를
직접 받은 뒤 가상 키보드로 재발행한다. 그래서 hidutil 계층보다 **앞선다.**
하지만 오른쪽 커맨드를 Karabiner 가 먼저 F18 로 바꿔버리면 gksdud 는 오른쪽 커맨드를
아예 보지 못한다. 이것도 빼야 한다.

### 1. Karabiner 에서 한영 매핑 제거

`simple_modifications` 에서 이 항목만 뺀다.

```json
{ "from": { "key_code": "right_command" }, "to": [{ "key_code": "f18" }] }
```

나머지 규칙(`fn → left_command`, `₩ → \``, 동시입력 규칙 등)은 한영과 무관하니 그대로 둔다.

### 2. Hammerspoon 에서 hidutil 매핑 제거

```lua
-- 한영 전환은 gksdud 로 이관.
-- gksdud 가 동일한 hidutil UserKeyMapping 슬롯을 사용하므로 여기서 매핑하면 서로 덮어쓴다.
-- local FRemap = require('foundation_remapping')
-- local remapper = FRemap.new()
-- remapper:remap('kana', 'f18')
-- remapper:register()
```

`⌥⌘R` 로 리로드한다. 참고로 Hammerspoon 의 AppleScript 지원이 꺼져 있으면
`osascript` 로 리로드를 못 시킨다. `hs.allowAppleScript(true)` 가 필요하다.

### 3. gksdud 설정

메뉴바 아이콘에서 손쉬운 사용 권한을 허용하고, 한영 키를 지정하고, "누를 때 전환" 을 켠다.

## 걸린 것 — gksdud 매핑은 전역 조회에 안 보인다

설정을 마치고 확인했더니 이상했다.

```bash
$ hidutil property --get "UserKeyMapping"
  Kana(한/영)  ->  F18
```

gksdud 가 걸었어야 할 `오른쪽 커맨드 → F19` 가 없다. 대신 지웠어야 할
Hammerspoon 잔재만 남아 있다. gksdud 가 동작을 안 하나 싶었는데 아니었다.

**gksdud 는 장치별로 `--matching` 필터를 걸어 매핑을 등록한다.**
필터 없는 `--get` 에는 그게 안 잡힌다. 실제 상태는 여기서 봐야 한다.

```bash
$ defaults read io.gksdud.inputswitch
{
    managedShortcutKeyCode = 80;        # 0x50 = F19. 시스템 단축키를 F19 로 바꿈
    originalShortcut = { ... };          # 바꾸기 전 F18 설정을 백업해둠
    records = {
        4316237946 = {
            source = 30064771303;        # -0x700000000 = 0xE7 = Right GUI
            target = 30064771182;        # -0x700000000 = 0x6E = F19
        };
        ...                              # 인식된 키보드마다 하나씩
    };
    knownKeyboards = { ... };
}
```

잘 돌고 있었다. 조회 방법이 틀렸던 것이다.

그리고 `hidutil --get` 에 남아 있던 `Kana → F18` 은 메모리에만 있는 잔재였다.
hidutil 매핑은 재부팅하면 사라지고, Hammerspoon 은 이제 다시 걸지 않으니 내버려 뒀다.

## 외장 키보드의 한/영 키

여기서 진짜 문제가 나왔다. 내장 키보드의 오른쪽 커맨드는 되는데 **외장 USB 키보드의
한/영 키가 먹통**이었다.

이유는 명확하다. gksdud 가 시스템 단축키를 **F19 로 바꿨는데**, 외장 키보드의 한/영 키는
아직 살아 있는 Hammerspoon 잔재 때문에 **F18 을 쏘고 있었다.** 받는 사람이 없다.

Karabiner EventViewer 로 확인하니 그 키는 `japanese_kana` 로 잡혔다.
일본어 키가 아니다. **한국어 키보드의 한/영 키와 일본어 Kana 키가 같은 HID usage `0x90`
(lang1)을 쓴다.** 그래서 도구들이 이걸 `kana` 나 `japanese_kana` 로 부른다.

그럼 gksdud 설정에서 한영 키를 한/영 키로 바꾸면 되나. 안 된다.
**gksdud 의 한영 키는 전역으로 하나다**(`TargetKey`). "대상 키보드 설정" 은 적용 여부만
고르는 것이지, 키보드마다 다른 키를 지정하는 기능이 아니다. 한/영 키로 바꾸면
내장 키보드의 오른쪽 커맨드가 죽는다.

### 해법 — Karabiner 를 앞단으로 쓴다

Karabiner 가 hidutil 보다 **앞선다**는 성질을 이용하면 된다.
한/영 키를 오른쪽 커맨드로 바꿔서, gksdud 가 이미 처리 중인 경로에 합류시킨다.

```json
{ "from": { "key_code": "japanese_kana" }, "to": [{ "key_code": "right_command" }] }
```

```
한/영 키 ─(Karabiner)→ right_command ─(gksdud)→ F19 → 입력 소스 전환
```

물리 키보드는 Karabiner 가 seize 해서 raw 키를 먼저 본다. 변환 결과는 Karabiner 가상
키보드로 나가고, 거기에 gksdud 매핑이 걸려 있다. 내장 키보드와 완전히 같은 경로가 된다.

Karabiner 를 쓰는 동안에는 gksdud 의 키보드 목록에 실제 키보드 대신
`Karabiner DriverKit VirtualHIDKeyboard` 가 뜬다. 이 항목이 켜져 있어야 동작한다.

## 남겨둔 것

Hammerspoon 에는 한영 관련 코드가 하나 더 있었다. IDEA·VS Code·Chrome·Warp 에서
`esc` 를 누르면 영문으로 강제 전환하는 것이다.

```lua
hs.keycodes.currentSourceID("com.apple.keylayout.ABC")
```

이건 남겼다. 다만 주의할 점이 있다. **gksdud 는 입력 소스를 직접 바꾸지 않는다**는 설계고,
이 코드는 정면으로 갈아끼운다. gksdud 의 대소문자 보존 기능이 추적하는 내부 상태와
어긋날 수 있다. 문제가 생기면 `hs.eventtap.keyStroke({}, 'f19')` 로 gksdud 의 중계 키를
쏘는 방식으로 바꾸면 된다.

화면 상단에 녹색 바를 그려 한글 입력 중임을 알려주는 스크립트도 그대로 뒀다.
gksdud 메뉴바 아이콘과 겹치긴 하는데, 시선이 가는 위치가 달라서 둘 다 쓸모가 있다.

## 정리

| 도구 | 계층 | 역할 |
| --- | --- | --- |
| [[karabiner-elements\|Karabiner]] | 장치 seize → 가상 HID | `japanese_kana → right_command` |
| [[gksdud]] | [[hidutil]] (장치별) | `right_command → F19` + 누를 때 전환 |
| 시스템 | `AppleSymbolicHotKeys:60` | F19 = 이전 입력 소스 선택 |

한영 전환이 안 될 때 볼 곳은 결국 **양쪽 끝이 같은 F-키를 가리키는가** 하나다.

```bash
# 이쪽이 쏘는 키 (HID usage: F18=0x6D, F19=0x6E)
hidutil property --get "UserKeyMapping"
defaults read io.gksdud.inputswitch

# 저쪽이 받는 키 (가상 키코드: F18=79, F19=80)
/usr/libexec/PlistBuddy -c "Print :AppleSymbolicHotKeys:60" \
  ~/Library/Preferences/com.apple.symbolichotkeys.plist
```

마지막으로 하나. gksdud 는 **정상 종료해야 키보드 설정이 복원된다.**
강제 종료하거나 그대로 지우면 hidutil 매핑과 시스템 단축키가 되돌려지지 않고 남는다.
업그레이드 전에는 메뉴바에서 종료할 것.
