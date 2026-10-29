---
title: "concat demuxer"
date: 2026-10-28T02:08:12+09:00
draft: false
tags: ["ffmpeg", "미디어"]
summary: "목록 파일에 적은 미디어들을 하나의 입력처럼 이어 읽는 ffmpeg 입력 형식."
altnames: ["concat 디먹서", "ffmpeg concat"]
---

concat demuxer 는 텍스트 목록에 적은 파일들을 순서대로 이어 하나의 입력으로 읽는 [[ffmpeg]] 의 입력 형식이다.

## 무엇인가

```
file 'a.mp4'
file 'b.png'
duration 1.5
```

- `ffmpeg -f concat -safe 0 -i list.txt ...` 로 쓴다. `-safe 0` 이 없으면 절대 경로와 특수 문자가 든 경로를 거부한다.
- `duration` 은 바로 앞 `file` 의 길이를 정한다. 이미지 여러 장을 시간표대로 이어 슬라이드나 자막 트랙을 만들 때 쓴다.
  마지막 이미지는 `duration` 이 무시되므로 같은 파일을 한 번 더 적는다.
- 코덱과 해상도가 같으면 `-c copy` 로 재인코딩 없이 이을 수 있다.
- 필터 그래프 안에서 스트림을 잇는 `concat` **필터**와는 다른 기능이다.

## 알아둘 것

- 목록 안의 상대 경로는 실행 위치가 아니라 목록 파일이 있는 폴더 기준으로 풀린다.
