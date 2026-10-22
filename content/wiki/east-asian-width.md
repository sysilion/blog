---
title: "East Asian Width"
date: 2026-10-15T15:24:34+09:00
draft: false
tags: ["unicode", "terminal"]
summary: "문자가 고정폭 환경에서 1칸인지 2칸인지 정하는 Unicode 속성 (UAX #11)."
altnames: ["EAW", "UAX 11", "Ambiguous width", "wcwidth"]
---

Unicode가 문자마다 붙인 폭 분류로, 터미널의 `wcwidth` 가 문자를 몇 칸으로 셀지 정하는 근거다.

## 무엇인가

| 값 | 뜻 | 터미널 폭 |
| --- | --- | --- |
| `W` / `F` | Wide / Fullwidth (한글, 한자, 전각 영문) | 2 |
| `Na` / `H` | Narrow / Halfwidth | 1 |
| `N` | Neutral (동아시아와 무관) | 1 |
| `A` | Ambiguous (①, ★, ◆, 그리스·키릴 일부, PUA) | 문맥 따라 1 또는 2 (대부분 1) |

Python: `unicodedata.east_asian_width("②")` → `'A'`.

## 알아둘 것

- `A` 를 2칸으로 세려면 터미널·셸·에디터가 모두 같은 설정이어야 한다. zsh는 libc `wcwidth` 를 따라 설정이 없다. 현실적으로 1칸이 표준이다.
- 폰트가 `A` 문자를 2칸 폭으로 그리면 터미널마다 겹치거나 축소해서 그린다.
- 사설 영역(U+E000–F8FF)도 `A` 다. Nerd Fonts 아이콘이 여기 있다.
