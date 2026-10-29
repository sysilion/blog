---
title: "git credential helper"
date: 2026-10-28T02:37:43+09:00
draft: false
tags: ["git"]
summary: "git이 HTTPS 원격에 쓸 사용자 이름과 비밀번호(토큰)를 받아 오는 외부 프로그램."
altnames: ["credential.helper", "자격 증명 헬퍼"]
---

credential helper 는 git 이 HTTPS 인증 정보를 직접 묻지 않고 외부 프로그램에서 받아 오게 하는 장치다.

## 무엇인가

- `credential.helper` 설정에 프로그램을 적는다. 예: `osxkeychain`(macOS 키체인), `store`(평문 파일), `!gh auth git-credential`([[gh-cli|gh]] 토큰).
- `credential.https://github.com.helper` 처럼 호스트별로 따로 둘 수 있다.
- 설정은 시스템 → 전역(`~/.gitconfig`) → 저장소 순서로 쌓인다. git 은 헬퍼를 그 순서대로 부르고, 처음 값을 돌려준 헬퍼의 답을 쓴다.
- 값을 빈 문자열로 넣으면(`credential.helper=""`) 그때까지 쌓인 헬퍼 목록이 비워진다. 그 뒤에 다시 `--add` 한 것만 남는다.

## 알아둘 것

- 실제로 어떤 계정이 쓰이는지는 `printf "protocol=https\nhost=github.com\n\n" | git credential fill` 로 확인한다.
- Homebrew git 은 시스템 설정에 `osxkeychain` 을 넣는다. 키체인에 예전 토큰이 남아 있으면 다른 헬퍼보다 먼저 쓰인다.
- `git config --show-origin --get-all credential.helper` 로 각 헬퍼가 어느 설정 파일에서 왔는지 볼 수 있다.
