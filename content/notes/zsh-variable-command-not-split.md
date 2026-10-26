---
title: "zsh에서 P=\"npx -y pnpm\"; $P install 은 명령 하나로 실행된다"
date: 2026-10-26T10:14:42+09:00
draft: false
tags: ["zsh", "shell"]
summary: "명령을 변수에 담아 $P 로 부르면 bash는 쪼개고 zsh는 통째로 명령 이름으로 쓴다."
---

## 무슨 일이

pnpm이 PATH에 없어서 `P="npx -y pnpm@12.14.0"` 로 담아 두고 `$P install` 을 실행했다.
설치는 한 줄도 돌지 않았고 이런 에러만 났다.

```
(eval):1: command not found: npx -y pnpm@12.14.0
```

공백까지 포함한 문자열 전체를 명령 이름 하나로 찾고 있었다.

## 원인

zsh는 따옴표 없는 `$P` 를 기본으로 [[word-splitting]] 하지 않는다 (`SH_WORD_SPLIT` 옵션이 꺼져 있다).
bash는 같은 자리에서 공백 기준으로 쪼개 `npx`, `-y`, `pnpm@...` 세 단어로 만든다.

## 재현

```bash
$ zsh -c 'P="echo a b"; $P'
zsh:1: command not found: echo a b
$ zsh -c 'P="echo a b"; ${=P}'
a b
$ bash -c 'P="echo a b"; $P'
a b
```

## 그래서

- zsh에서 꼭 변수로 넘겨야 하면 `${=P}` 로 쪼개라고 명시한다.
- 그보다는 명령을 그대로 적거나, 작은 래퍼 스크립트를 만들어 PATH 앞에 두는 편이 덜 헷갈린다.
  ```bash
  printf '#!/bin/sh\nexec npx -y pnpm@12.14.0 "$@"\n' > bin/pnpm && chmod +x bin/pnpm
  PATH=$PWD/bin:$PATH git commit ...   # husky 훅의 pnpm 도 이걸 찾는다
  ```
- 배열 변수(`F=(a b c)`)는 zsh에서 원소 단위로 펼쳐지므로 이 문제가 없다.

## 한 줄

> zsh에서 "command not found" 뒤에 공백 섞인 이름이 찍히면 변수에 담은 명령을 의심하고, `${=VAR}` 나 래퍼 스크립트로 바꾼다.
