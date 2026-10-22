---
title: "키를 등록해 뒀는데 SSH가 비밀번호를 묻는다 — 키 파일 이름이 기본값이 아니었다"
date: 2026-10-21T01:40:34+09:00
draft: false
tags: ["ssh", "openssh"]
summary: "id_ed2551ib 처럼 기본 이름이 아닌 키는 ssh가 자동으로 시도하지 않는다. config에 IdentityFile이 없으면 비밀번호 단계로 넘어간다."
---

## 무슨 일이

서버(MacStudio)에 공개키를 넣어 뒀는데 `ssh 192.168.1.132` 가 비밀번호를 물었다. `BatchMode=yes` 로는 이렇게 끝났다.

```
sysilion@192.168.1.132: Permission denied (publickey,password,keyboard-interactive).
```

## 원인

서버에 등록된 키는 `~/.ssh/id_ed2551ib` 였다. `ssh` 는 `~/.ssh/config` 에 [[ssh-identityfile|IdentityFile]] 이 없으면
정해진 기본 이름(`id_rsa`, `id_ecdsa`, `id_ed25519` …)만 시도한다. 이름이 기본값이 아닌 키는 아예 보내지 않는다.
agent 도 비어 있었으니(`ssh-add -l` → `The agent has no identities.`) 시도할 수 있는 키는 `id_ed25519` 하나뿐이었고,
서버가 그 키를 거부하자 다음 인증 방식인 비밀번호로 넘어갔다.

## 재현

```bash
ssh -v -o BatchMode=yes 192.168.1.132 true 2>&1 | grep -E "Will attempt|Offering"
# Will attempt key: ~/.ssh/id_ed25519 ...   ← id_ed2551ib 는 목록에 없다
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i ~/.ssh/id_ed2551ib 192.168.1.132 whoami
# sysilion                                   ← 키를 지정하면 바로 붙는다
```

## 그래서

`~/.ssh/config` 에 호스트별로 키를 지정한다.

```
Host 192.168.1.132
  IdentityFile ~/.ssh/id_ed2551ib
  IdentitiesOnly yes
```

## 한 줄

키가 등록됐는데 비밀번호를 물으면 `ssh -v` 의 `Will attempt key` 목록에 그 키가 있는지부터 본다.
