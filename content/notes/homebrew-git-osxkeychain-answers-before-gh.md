---
title: "Homebrew git의 osxkeychain이 gh보다 먼저 자격 증명을 내준다"
date: 2026-10-28T02:37:43+09:00
draft: false
tags: ["git", "github", "gh-cli"]
summary: "gh 활성 계정이 맞는데도 push가 'Repository not found'로 실패했다. 시스템 gitconfig의 osxkeychain이 다른 계정 토큰을 먼저 돌려주고 있었다."
---

## 무슨 일이

`gh repo create --push` 로 만든 private 저장소에 다음 커밋을 `git push` 했더니 실패했다.

```
remote: Repository not found.
fatal: repository 'https://github.com/sysilion/vodcut.git/' not found
```

`gh auth status` 의 활성 계정은 저장소 주인(sysilion)이었고 `gh repo view` 도 잘 됐다.
[[gh-multi-account-repo-not-found|활성 계정이 틀린 경우]]와 증상은 같은데 원인이 달랐다.

## 원인

git 은 [[git-credential-helper|credential helper]]를 설정된 순서대로 부르고, 처음 답한 값을 쓴다.
Homebrew 로 설치한 git 은 시스템 설정(`/opt/homebrew/etc/gitconfig`)에 `osxkeychain` 을 넣어 둔다.
그래서 전역 설정의 `gh auth git-credential` 보다 키체인이 먼저 불리고, 키체인에는 예전에 저장된 회사 계정(sysilion-ib) 토큰이 있었다.
`gh repo create --push` 는 gh 가 직접 인증해서 이 문제를 비켜 갔다.

## 재현

```bash
git config --show-origin --get-all credential.helper
# file:/opt/homebrew/etc/gitconfig  osxkeychain
git config --get-all credential.https://github.com.helper
# !/opt/homebrew/bin/gh auth git-credential
printf "protocol=https\nhost=github.com\n\n" | git credential fill | grep username
# username=sysilion-ib        ← gh 활성 계정과 다르다
```

## 그래서

그 저장소에서만 헬퍼 목록을 비우고 gh 를 다시 넣었다. 빈 값이 앞선 헬퍼 목록을 초기화한다.

```bash
git config --local credential.helper ""
git config --local --add credential.helper "!/opt/homebrew/bin/gh auth git-credential"
printf "protocol=https\nhost=github.com\n\n" | git credential fill | grep username   # sysilion
```

## 한 줄

> push 가 'Repository not found' 로 실패하면 `gh auth status` 다음에 `git credential fill` 로 실제로 쓰이는 계정을 확인한다.
