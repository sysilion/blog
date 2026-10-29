---
title: "yt-dlp"
date: 2026-10-27T00:46:32+09:00
draft: false
tags: ["youtube", "cli", "python"]
summary: "유튜브 등 동영상 사이트에서 정보·영상·자막을 받는 오픈소스 도구. CLI와 파이썬 모듈 둘 다로 쓴다."
altnames: ["yt_dlp", "youtube-dl"]
---

yt-dlp는 youtube-dl에서 갈라져 나온 동영상 다운로더다. 명령줄 도구와 파이썬 모듈(`yt_dlp`)을 함께 제공한다.

## 구조

- `YoutubeDL(opts).extract_info(url, download=False)` 가 영상 정보를 사전으로 돌려준다. 형식 목록(`formats`), 자막(`subtitles`), 길이, 채널 같은 값이 들어 있다.
- 형식마다 `format_id`, `vcodec`/`acodec`, `abr`, `protocol`, 직접 주소(`url`)와 요청 헤더(`http_headers`)가 있다. `vcodec == "none"` 이면 오디오 전용이다.
- 유튜브 라이브 다시보기는 채팅 다시보기를 `live_chat` 이라는 자막으로 내준다. 받으면 줄마다 JSON 하나인 파일이고, 각 줄의 `videoOffsetTimeMsec` 가 영상 기준 시각이다.
- `progress_hooks` 로 받는 진행 상황을 볼 수 있다. 훅에서 예외를 던지면 받기를 멈출 수 있는데, 일반 `Exception` 은 yt-dlp가 잡아 오류로 바꿀 수 있다.
- `getcomments` 와 `extractor_args` 의 `max_comments` 로 댓글도 받는다.

## 알아둘 것

- 유튜브는 통째로 받는 요청을 재생 속도에 가깝게 묶는다. yt-dlp는 조각으로 나눠 받아 피한다. 직접 주소를 다른 도구에 넘기면 이 이점이 사라진다.
- 유튜브 쪽 변경이 잦아 버전을 자주 올려야 한다. 고정할 때는 정확한 버전으로 적는다.
