---
title: "gh"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["git", "github", "cli"]
summary: "GitHub 공식 CLI. git HTTPS 인증의 credential helper 역할도 한다."
altnames: ["GitHub CLI", "gh cli"]
---

GitHub 공식 CLI. 저장소·PR·이슈 조작 외에 **git HTTPS 인증의 credential helper** 로도 동작한다.
`gh auth login` 을 하면 git이 HTTPS 요청에 그 토큰을 쓴다.

## 알아둘 것

`gh` 는 **여러 계정을 동시에 로그인**해두고 하나를 활성 계정으로 둔다.
활성 계정 토큰이 git 인증에 그대로 전달되므로, 권한 없는 계정이 활성 상태면
private 저장소 접근이 실패한다.

이때 GitHub는 **403이 아니라 404를 준다.** private 저장소의 존재 여부 자체를 숨기려는 의도적 동작이라
"권한 없음"이 아니라 `Repository not found` 로 보인다.

```bash
gh auth status          # 활성 계정 확인
gh auth switch -u <계정>
```

credential helper로서의 `gh` 는 **계정을 골라주지 않는다.** git이 넘기는 `username=` 과 무관하게
활성 계정 토큰만 내놓고, 다른 계정 이름에는 빈 응답을 준다 (gh 2.100.0 확인).
따라서 `credential.https://github.com.username` 을 지정해도 계정이 바뀌지 않는다.

저장소별로 계정을 고정하려면 `~/.gitconfig` 의 `includeIf "gitdir:..."` 로 디렉토리마다 갈라두되,
**계정별 토큰을 직접 물린 helper를 함께 지정**해야 한다. 아니면 그때그때 `gh auth switch` 를 하는 수밖에 없다.
