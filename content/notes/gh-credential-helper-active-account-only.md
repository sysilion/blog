---
title: "gh credential helper는 요청한 계정이 아니라 활성 계정만 응답한다"
date: 2026-09-10T15:00:00+09:00
draft: false
tags: ["git", "github", "gh-cli"]
summary: "credential.username으로 계정을 지정해도 소용없다. 다중 계정이면 결국 gh auth switch를 해야 한다."
---

## 무슨 일이

`~/proj` 에서 git 원격 작업 직전에만 계정을 바꾸는 훅을 짜다가, **전환 자체를 없앨 수 있지 않을까** 싶었다.
git은 credential helper에 `username=` 을 같이 넘긴다. [[gh-cli|gh]]가 그 이름에 맞는 토큰을 돌려준다면
`~/.gitconfig` 의 `includeIf` 로 디렉토리마다 `credential.https://github.com.username` 만 갈라두면 끝이다.

안 된다. gh는 **활성 계정 하나만** 응답한다.

## 원인

`gh auth git-credential get` 은 요청의 `username` 을 매칭 키로 쓰지 않는다.
로그인된 계정이 여럿이어도 `hosts.yml` 의 활성 계정 토큰만 내놓고, 그 외 이름에는 **빈 응답**을 준다.
빈 응답을 받은 git은 다음 helper로 넘어가거나 인증에 실패한다.

## 재현

두 계정(`sysilion`, `sysilion-ib`)이 로그인돼 있고 활성 계정이 `sysilion` 인 상태.

```bash
$ gh --version
gh version 2.100.0 (2026-09-03)

$ printf 'protocol=https\nhost=github.com\nusername=sysilion\n\n' | gh auth git-credential get
protocol=https
host=github.com
username=sysilion
password=gho_xxxxxxxx          # 활성 계정 → 토큰이 나온다

$ printf 'protocol=https\nhost=github.com\nusername=sysilion-ib\n\n' | gh auth git-credential get
                               # 비활성 계정 → 아무것도 안 나온다
```

## 그래서

다중 계정에서 저장소별로 계정을 고정하려면 둘 중 하나다.

- `gh auth switch` 로 전역 활성 계정을 그때그때 바꾼다 — `~/.config/gh/hosts.yml` 을 고치는 **전역 상태**라
  동시에 도는 다른 셸·세션과 충돌한다. 전환 창을 명령 실행 시간만큼으로 줄이는 게 최선이다.
- gh helper를 쓰지 않고 계정별 토큰을 직접 물린 helper를 디렉토리마다 `includeIf` 로 붙인다.

`includeIf` + `credential.username` 조합만으로는 해결되지 않는다는 점이 함정이다.
설정은 얌전히 먹지만 gh가 무시한다.

## 한 줄

**`gh` 는 credential helper로서 계정을 골라주지 않는다. 요청에 적힌 username과 무관하게 활성 계정 토큰만 준다.**
