---
title: "yt-dlp가 준 유튜브 오디오 주소를 ffmpeg에 바로 넣으면 재생 속도 정도로만 받아진다"
date: 2026-10-27T00:46:32+09:00
draft: false
tags: ["youtube", "yt-dlp", "ffmpeg"]
summary: "43분 영상 음량 분석이 10분 넘게 끝나지 않았다. yt-dlp로 파일을 먼저 받게 바꾸니 채팅까지 합쳐 56초였다."
---

## 무슨 일이

chicle에 유튜브 라이브 다시보기 분석을 붙였다. [[yt-dlp]]로 오디오 전용 형식(139, m4a 48kbps)의 googlevideo 주소를 얻어 치지직 오디오처럼 [[ffmpeg]] `-i` 에 바로 넣었다. 43분짜리 영상의 음량 분석이 10분이 지나도 끝나지 않았다.

## 원인

유튜브는 한 번에 통째로 받는 요청을 재생 속도에 가깝게 묶는다. yt-dlp는 유튜브 형식을 받을 때 조각(Range) 요청으로 나눠 받기 때문에 이 제한에 걸리지 않는다. ffmpeg는 주소를 그냥 이어 읽어서 제한을 그대로 맞았다.

## 재현

```python
import yt_dlp
opts = {"quiet": True, "skip_download": True}
info = yt_dlp.YoutubeDL(opts).extract_info("https://www.youtube.com/watch?v=hqQ5-vgX00M", download=False)
url = next(f["url"] for f in info["formats"] if f["format_id"] == "139")
# ffmpeg -i "$url" -f s16le -ac 1 -ar 16000 - > /dev/null   → 실시간에 가까운 속도
# yt-dlp -f 139 -o a.m4a "https://www.youtube.com/watch?v=hqQ5-vgX00M"  → 수 초
```

## 그래서

오디오는 yt-dlp로 임시 파일(`$TMPDIR/chicle-youtube-audio/`)에 먼저 받고, ffmpeg에는 파일 경로를 준다. 전사까지 끝나면 지운다. 같은 43분 영상이 채팅 수집, 음량 분석, 댓글 수집까지 56초에 끝났다.

## 한 줄

유튜브 미디어는 주소만 꺼내 다른 도구에 넘기지 말고 yt-dlp로 받게 한다. 느리면 먼저 이 제한을 의심한다.
