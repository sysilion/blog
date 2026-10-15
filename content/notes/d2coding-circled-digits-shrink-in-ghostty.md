---
title: "D2Coding의 ②는 Ghostty에서 뒤에 글자가 붙으면 작아진다"
date: 2026-10-15T15:24:34+09:00
draft: false
tags: ["font", "terminal", "ghostty", "unicode"]
summary: "Ambiguous 폭 문자를 폰트가 전각으로 그려서, 터미널이 1칸 자리에 2칸 글리프를 맞추느라 생긴 일."
---

## 무슨 일이

Ghostty에서 `②②-` 를 치면 첫 `②` 는 크고 둘째 `②` 는 작다. 띄어 쓰면 다시 커진다.
VS Code 편집기에서는 멀쩡하다.

## 원인

`②`(U+2461)는 [[east-asian-width]]가 **A(Ambiguous)** 라서 터미널·셸은 1칸으로 센다.
그런데 D2Coding(1.3.2, 1.4.0 모두)은 이 글리프를 advance 1000, 즉 2칸으로 그린다.
Ghostty는 넘치는 글리프를 오른쪽 칸이 비어 있으면 넘치게 그리고, 차 있으면 1칸에 맞춰 줄인다.
VS Code 편집기는 격자가 아니라 글리프 폭대로 그리니 문제가 안 보인다.

iTerm2의 "Ambiguous characters are double-width" 는 터미널만 2칸으로 세게 바꾸고 zsh는 여전히 1칸으로 세서 커서가 어긋난다.
Ghostty 1.3.1·Orca(xterm.js)에는 그런 옵션도 없다.

## 재현

```python
# pip install fonttools
import unicodedata
from fontTools.ttLib import TTFont
t = TTFont("D2Coding-Ver1.4.0-20261003.ttf")
c, h = t.getBestCmap(), t["hmtx"]
print(h[c[0x2461]][0], unicodedata.east_asian_width("②"))   # 1000 A
print(sum(1 for cp, g in c.items() if h[g][0] >= 1000
          and unicodedata.east_asian_width(chr(cp)) == "A"
          and not 0xE000 <= cp <= 0xF8FF))                   # 139
```

## 그래서

맞출 수 있는 건 "1칸" 쪽뿐이다. 139자를 0.527배로 줄여 1칸 가운데에 둔 터미널용 변형
`D2KodingTerm(Ligature) Nerd Font` 를 만들어 Ghostty에 지정했다. upstream: naver/d2-coding-font#118.

## 한 줄

터미널에서 글자 크기가 위치마다 다르면 폰트 폭과 wcwidth가 서로 다른 말을 하고 있는 것이다.
