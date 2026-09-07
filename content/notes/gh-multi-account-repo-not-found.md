---
title: "gh 다중 계정에서 private 저장소가 'Repository not found'로 뜬다"
date: 2026-09-02T11:00:00+09:00
draft: false
tags: ["git", "github", "gh-cli"]
summary: "권한 없는 계정이 활성 상태일 때 GitHub는 404를 준다. 인증 오류가 아니라 저장소가 없다고 나온다."
aliases: ["/wiki/gh-multi-account-repo-not-found/"]
---

## 무슨 일이

`~/proj` 하위 프로젝트를 일괄 `git pull` 했더니 대부분이 이렇게 실패했다.

```
remote: Repository not found.
fatal: repository 'https://github.com/sysilion/AutoMMD.git/' not found
```

그런데 `blog`, `sysilion.github.io`, `redtable_point` 는 정상으로 받아졌다.
저장소는 분명히 존재하고, remote URL도 맞다.

## 원인

[[gh-cli|gh CLI]]에 계정이 두 개 로그인돼 있었고, 활성 계정이 회사 계정이었다.

```bash
$ gh auth status
github.com
  ✓ Logged in to github.com account sysilion-ib   # ← Active account: true
  ✓ Logged in to github.com account sysilion
```

git이 HTTPS 인증에 `gh` credential helper를 쓰기 때문에, 활성 계정 토큰이 그대로 전달된다.
회사 계정에는 개인 private 저장소 권한이 없다.

핵심은 GitHub가 이때 **403이 아니라 404를 준다**는 점이다. private 저장소의 존재 여부 자체를 숨기려는 의도적 동작이라, "권한 없음"이 아니라 "그런 저장소 없음"으로 보인다. 성공한 세 개는 전부 public 저장소였다.

## 재현

```bash
gh auth switch -u <권한-없는-계정>
git clone https://github.com/<owner>/<private-repo>.git
# remote: Repository not found.

gh auth switch -u <권한-있는-계정>
git clone https://github.com/<owner>/<private-repo>.git
# 정상
```

## 그래서

일괄 pull 전에 활성 계정을 먼저 확인한다.

```bash
gh auth status | grep -A1 'account'
gh auth switch -u sysilion
```

저장소별로 계정을 고정하고 싶으면 `~/.gitconfig` 의 조건부 include로 디렉토리마다 갈라두는 편이 낫다.

```gitconfig
[includeIf "gitdir:~/proj/"]
    path = ~/.gitconfig-personal
[includeIf "gitdir:~/IdeaProjects/"]
    path = ~/.gitconfig-work
```

## 한 줄

**`gh` 다중 계정 환경에서 private 저장소의 `Repository not found` 는 저장소가 없다는 뜻이 아니라 지금 활성 계정에 권한이 없다는 뜻이다.**
