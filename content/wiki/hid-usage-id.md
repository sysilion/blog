---
title: "HID usage ID"
date: 2026-09-18T17:02:29+09:00
draft: false
tags: ["hid", "keyboard"]
summary: "USB HID 규격이 정한 키 번호. 운영체제의 가상 키코드와는 다른 체계다."
altnames: ["HID usage", "usage page"]
---

**HID usage ID**는 USB-IF의 HID Usage Tables가 정한 입력 요소 번호다.
`usage page` + `usage ID` 쌍으로 하나의 키를 가리킨다. 키보드는 page 7이다.

## 자주 쓰는 값 (page 7)

| usage | 키 |
| --- | --- |
| `0x29` | Escape |
| `0x39` | Caps Lock |
| `0x3A`~`0x45` | F1~F12 |
| `0x68`~`0x73` | **F13~F24** |
| `0x6D` | F18 |
| `0x6E` | F19 |
| `0x88` | International2 (かな/로마자) |
| `0x90` | **lang1 (Kana / 한·영)** |
| `0x91` | lang2 (Eisu / 한자) |
| `0xE7` | Right GUI (오른쪽 커맨드) |

## 알아둘 것

- **F13~F24는 규격에 있지만 물리 키가 거의 없다.** 충돌 위험이 없어서
  키 리매핑의 중계 지점으로 널리 쓰인다. macOS 한영 전환이 F18/F19를 경유하는 이유다.
- **가상 키코드와 헷갈리지 말 것.** macOS의 `kVK_*` 는 다른 번호 체계다.
  F18은 HID로 `0x6D`, macOS 가상 키코드로 `0x4F`(79)다.
  [[hidutil]] 은 HID 값을, `AppleSymbolicHotKeys` 는 가상 키코드를 쓴다.
- 한국어 키보드의 한/영 키는 일본어 Kana와 **같은 `0x90`** 을 쓴다.
  그래서 도구들이 이 키를 `kana` 나 `japanese_kana` 로 부른다.
