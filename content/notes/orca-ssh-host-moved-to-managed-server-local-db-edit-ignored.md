---
title: "Orca 업데이트 뒤 SSH 프로젝트 그룹은 로컬 DB를 고쳐도 안 바뀐다"
date: 2026-10-20T11:20:16+09:00
draft: false
tags: ["orca", "ssh", "sqlite"]
summary: "1.4.230 업데이트로 SSH 호스트가 관리 서버로 옮겨져, 그룹과 프로젝트의 원본이 원격으로 넘어갔다."
---

## 무슨 일이

MACSTUDIO(SSH) 쪽 IdeaProjects 프로젝트들이 그룹 미지정으로 떠서, 데스크톱의 `profile-state.db` 에
9/29 백업의 그룹을 되살려 넣었다. DB에도 들어갔고 재시작 뒤에도 남았는데, 사이드바는 그대로였다.

## 원인

같은 날 Orca 1.4.230 업데이트 때 SSH 타깃이 [[orca-managed-server|관리 서버]] 환경으로 옮겨졌다.
그 뒤로 그 호스트의 프로젝트·그룹은 MACSTUDIO의 `orcad` 가 소유하고, 데스크톱 DB에 남은 건 옮기기 전 사본이다.
화면은 서버 카탈로그를 그린다. 예전 IdeaProjects 그룹은 옮기기 전에 이미 로컬에서 사라져 있어서 옮겨지지 않았다.

## 재현

```bash
# 마이그레이션 기록
jq '{phase, destinationName, sshTargetId}' \
  ~/Library/Application\ Support/orca/orcad-migration-cutovers/*.json

# 로컬 사본과 서버 원본의 그룹 상태 비교
orca repo list --json | jq '[.result.repos[]|select(.projectGroupId==null)]|length'
orca repo list --environment MACSTUDIO --json \
  | jq '[.result.repos[]|select(.projectGroupId==null)]|length'
```

## 그래서

SSH 호스트를 관리 서버로 옮긴 뒤에는 그 호스트의 그룹을 서버 쪽 UI나 서버 DB에서 고쳐야 한다.
데스크톱 DB를 직접 고치는 건 효과가 없다. 원격 프로젝트를 이 컴퓨터의 그룹에 넣는 것도 안 된다.

## 한 줄

관리 서버로 옮긴 호스트의 그룹이 이상하면 `orca repo list --environment <호스트>` 로 서버 쪽 상태를 먼저 보고, 고치는 것도 서버 쪽에서 한다.
