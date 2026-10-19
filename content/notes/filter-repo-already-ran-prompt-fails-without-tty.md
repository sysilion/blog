---
title: "git filter-repo 는 하루 지난 실행 기록이 있으면 --force 를 줘도 Y/N 을 묻는다"
date: 2026-10-19T17:57:13+09:00
draft: false
tags: ["git", "cli"]
summary: "TTY 없이 돌리면 EOFError 로 죽는다. 에이전트·CI 에서는 답을 stdin 으로 넘겨야 한다."
---

## 무슨 일이

공개 저장소에서 파일 몇 개를 히스토리째 지우려고 [[git-filter-repo]] 를 `--force` 로 돌렸다.
비대화형 셸이었는데 이렇게 죽었다.

```
The previous run is older than a day (.git/filter-repo/already_ran already exists).
Treat this run as a continuation of filtering in the previous run (Y/N)? Traceback (most recent call last):
  ...
EOFError: EOF when reading a line
```

같은 명령 뒤에 붙여 둔 검증 단계는 그대로 돌아서, 히스토리가 하나도 안 바뀐 채 "남은 흔적 N개" 만 찍혔다.

## 원인

예전에 이 저장소에서 filter-repo 를 한 번 돌린 적이 있었고, 그 기록 `.git/filter-repo/already_ran` 이 남아 있었다.
이 파일이 **하루보다 오래됐으면** filter-repo 는 이번 실행이 이전 필터링의 연장인지 묻는다.
`--force` 는 "새 클론이 아니다" 검사만 건너뛸 뿐 이 질문은 건너뛰지 않는다.
답은 `input()` 으로 받으므로 stdin 이 닫혀 있으면 [[eof|EOF]] 로 예외가 난다.

## 재현

```bash
mkdir fr && cd fr && git init -q && echo a>a && echo b>b && git add . && git commit -qm init
git filter-repo --force --invert-paths --path a
touch -t 202610170000 .git/filter-repo/already_ran        # 하루 전으로
git filter-repo --force --invert-paths --path b </dev/null # → EOFError
echo N | git filter-repo --force --invert-paths --path b   # → Completely finished
```

## 그래서

- 별개의 새 작업이면 `N` 을 넘긴다. `echo N | git filter-repo ...`
- 실패해도 다음 단계로 넘어가지 않게 `set -e` 나 `&&` 로 엮는다. 이번엔 `;` 로 이어 둬서 검증 출력이
  마치 실행 결과처럼 보였다.
- filter-repo 는 `origin` 도 지운다. 실패한 실행은 지우기 전에 죽어서, 뒤의 `git remote add origin` 이
  "이미 있다" 로 실패했다. 이 에러도 성공 여부를 가늠하는 단서다.

## 한 줄

> **`--force` 는 모든 확인을 끄는 스위치가 아니다. 오래된 `already_ran` 은 대화형 질문을 부른다.**
