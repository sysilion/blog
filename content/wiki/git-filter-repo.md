---
title: "git filter-repo"
date: 2026-10-19T17:57:13+09:00
draft: false
tags: ["git", "history"]
summary: "git 히스토리 전체를 다시 쓰는 도구. 파일 제거·경로 이동·메시지 수정을 한 번에 한다."
altnames: ["filter-repo", "git-filter-repo"]
---

git 히스토리의 모든 커밋을 순회하며 내용·경로·메시지를 고쳐 새 히스토리를 만드는 도구.
`git filter-branch` 를 대체하는 공식 권장 도구다.

## 무엇인가

- `git fast-export` 스트림을 받아 고친 뒤 `git fast-import` 로 다시 넣는다. 그래서 빠르다.
- 자주 쓰는 형태

  ```bash
  git filter-repo --invert-paths --path secret.md          # 파일을 모든 커밋에서 제거
  git filter-repo --invert-paths --paths-from-file list.txt
  git filter-repo --message-callback 'return message.replace(b"old", b"new")'
  ```

- 콜백은 Python 코드 조각이다. 문자열은 전부 `bytes` 다.

## 알아둘 것

- **새로 클론한 저장소가 아니면 거부한다.** 작업 중인 저장소에서는 `--force` 가 필요하다.
- **`origin` 리모트를 일부러 지운다.** 실수로 옛 히스토리에 push 하지 않게 하려는 것. 끝나면 다시 붙인다.
- 실행 기록을 `.git/filter-repo/` 에 남긴다. `already_ran` 이 오래됐으면 다음 실행에서
  대화형으로 "이어서 할지" 묻는다.
- 히스토리를 고친 뒤에는 force push 가 필요하고, 이미 받아 간 클론·포크·호스팅 캐시에는 효과가 없다.
