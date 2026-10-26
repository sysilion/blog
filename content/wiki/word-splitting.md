---
title: "Word splitting"
date: 2026-10-26T10:14:42+09:00
draft: false
tags: ["shell", "zsh", "bash"]
summary: "따옴표 없는 변수 확장 결과를 IFS 기준으로 여러 단어로 나누는 셸 동작. bash는 하고 zsh는 기본으로 하지 않는다."
altnames: ["단어 분할", "SH_WORD_SPLIT"]
---

셸이 따옴표 없이 확장된 변수 값을 `IFS`(기본: 공백·탭·줄바꿈) 기준으로 잘라 여러 인자로 만드는 단계다.

## 무엇인가

```bash
P="echo a b"
$P        # bash: echo, a, b 세 단어 → "a b" 출력
"$P"      # 따옴표가 있으면 쪼개지 않는다 → "echo a b" 라는 명령을 찾는다
```

POSIX sh와 bash는 따옴표 없는 `$VAR` 에 word splitting을 적용한다.
zsh는 `SH_WORD_SPLIT` 옵션이 기본으로 꺼져 있어서 `$VAR` 를 한 단어로 둔다.

| 셸 | `$P` | 강제로 쪼개기 |
| --- | --- | --- |
| bash, sh | 쪼갬 | (기본) |
| zsh | 안 쪼갬 | `${=P}` 또는 `setopt SH_WORD_SPLIT` |

## 알아둘 것

- 인자 여러 개를 변수에 담아야 하면 문자열보다 배열이 안전하다. bash는 `"${arr[@]}"`, zsh는 `$arr` 로 원소 단위로 펼쳐진다.
- bash 스크립트를 zsh에서 `source` 하거나 복사해 쓰면 이 차이로 동작이 갈린다.
- bash에서 따옴표를 빼먹으면 반대로 공백이 든 파일명이 여러 인자로 쪼개진다. 대부분의 셸 버그가 이쪽이다.
