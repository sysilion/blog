---
title: "libass"
date: 2026-10-27T16:47:47+09:00
draft: false
tags: ["미디어", "자막"]
summary: "ASS/SSA 자막을 렌더링하는 C 라이브러리. ffmpeg의 subtitles·ass 필터가 이것에 의존한다."
altnames: ["ASS 자막 렌더러"]
---

libass 는 ASS(Advanced SubStation Alpha) 자막 파일을 비트맵으로 그려주는 오픈소스 렌더러다.

## 무엇인가

- ASS 는 자막마다 폰트, 크기, 색, 외곽선, 그림자, 위치, 회전, 글자 단위 타이밍(`\k` 카라오케)을 지정할 수 있는 형식이다. SRT 보다 표현력이 훨씬 넓다.
- [[ffmpeg]] 에서는 `subtitles=file.srt` 나 `ass=file.ass` 필터로 자막을 영상에 굽는데, 두 필터 모두 libass 가 링크돼 있어야 생긴다.
- mpv, VLC 같은 플레이어도 ASS 표시에 libass 를 쓴다.

## 알아둘 것

- ffmpeg 빌드에 libass 가 들어 있는지는 `ffmpeg -hide_banner -buildconf | grep libass` 로 확인한다.
- 폰트는 fontconfig 로 찾는다. 시스템에 없는 폰트를 쓰려면 `subtitles=x.ass:fontsdir=./fonts` 처럼 폴더를 넘긴다.
