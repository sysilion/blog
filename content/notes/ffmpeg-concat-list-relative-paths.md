---
title: "ffmpeg concat 목록의 상대 경로는 목록 파일 기준으로 풀린다"
date: 2026-10-28T02:08:12+09:00
draft: false
tags: ["ffmpeg", "영상편집"]
summary: "작업 폴더를 상대 경로로 넘겼더니 concat 목록 안의 경로가 두 번 붙어 'work/e2e/out.work/work/e2e/out.work/sub0000.png'를 찾았다."
---

## 무슨 일이

자막 PNG 를 [[concat-demuxer]] 목록(`subs.txt`)으로 이어 붙이는 렌더러를 CLI 로 감쌌다.
작업 폴더를 `work/e2e/out.work` 처럼 상대 경로로 넘기자 ffmpeg 가 이렇게 실패했다.

```
Impossible to open 'work/e2e/out.work/work/e2e/out.work/sub0000.png'
```

스크립트를 절대 경로 작업 폴더로만 돌릴 때는 드러나지 않았다.

## 원인

concat 목록의 `file` 줄에 적힌 상대 경로는 실행 위치(cwd)가 아니라 **목록 파일이 있는 폴더** 기준으로 풀린다.
목록이 `work/e2e/out.work/subs.txt` 에 있고 그 안에 `file 'work/e2e/out.work/sub0000.png'` 라고 적었으니 경로가 두 번 겹쳤다.

## 재현

```bash
mkdir -p a/b && ffmpeg -v error -f lavfi -i color=red:s=16x16 -frames:v 1 a/b/x.png
printf "file 'a/b/x.png'\nduration 1\n" > a/b/list.txt
ffmpeg -v error -f concat -safe 0 -i a/b/list.txt -f null -   # a/b/a/b/x.png 를 찾다 실패
printf "file 'x.png'\nduration 1\n" > a/b/list.txt
ffmpeg -v error -f concat -safe 0 -i a/b/list.txt -f null -   # 성공
```

## 그래서

목록을 만드는 쪽에서 작업 폴더를 `Path(work).resolve()` 로 절대 경로로 바꾼 뒤 적는다.
목록 파일과 같은 폴더의 파일만 쓴다면 파일 이름만 적어도 된다.

## 한 줄

> concat 목록을 코드로 만들 때는 `file` 줄에 절대 경로를 쓰고, 상대 경로를 쓸 거면 목록 파일 위치를 기준으로 계산한다.
