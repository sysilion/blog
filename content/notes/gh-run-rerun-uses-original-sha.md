---
title: "gh run rerun 은 원래 커밋으로 다시 돌아서, 그 사이 main 이 움직였으면 자동 커밋 push 가 거부된다"
date: 2026-10-13T16:34:41+09:00
draft: false
tags: ["github-actions", "ci", "git"]
summary: "재실행은 최신 main 이 아니라 처음 실행했던 SHA 를 체크아웃한다. 데이터를 갱신하는 워크플로우는 rerun 대신 새로 dispatch 해야 한다."
---

## 무슨 일이

subculture-timeline 의 스케줄 워크플로우(데이터 갱신 → 자동 커밋)가 실패해서 `gh run rerun` 으로 다시 돌렸다.
처음 실패 원인(프록시 호스트 DNS 해석 실패)은 해결돼 있었는데, 이번엔 `Commit if changed` 단계에서 실패했다.

```
! [rejected]        main -> main (non-fast-forward)
hint: Updates were rejected because the tip of your current branch is behind
```

## 원인

[[github-actions]] 의 재실행은 **처음 실행 때의 `GITHUB_SHA`** 를 그대로 쓴다. 첫 실행이 이미 커밋 하나를 push 해둔 상태라
main 은 앞으로 가 있었고, 재실행은 그보다 뒤처진 커밋 위에서 새 커밋을 만들어 push 하려 했다.

## 재현

```bash
gh run rerun <실패한-run-id>           # 첫 실행이 이미 push 를 했다면 → non-fast-forward
gh run view <run-id> --log | grep rejected
```

## 그래서

main 에 커밋을 남기는 워크플로우는 rerun 하지 말고 새로 트리거한다.

```bash
gh workflow run update-data.yml        # 최신 main 을 체크아웃한다
```

## 한 줄

rerun 은 "같은 커밋으로 다시"이지 "지금 상태로 다시"가 아니다.
