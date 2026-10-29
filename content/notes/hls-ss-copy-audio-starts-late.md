---
title: "HLS를 -ss와 스트림 복사로 자르면 음성이 영상보다 1초 늦게 시작한다"
date: 2026-10-29T00:18:48+09:00
draft: false
tags: ["ffmpeg", "영상편집", "hls"]
summary: "음성 start_time이 1.0초라서 삐 소리는 1초 늦게, 음성만 뽑은 자막과 파형은 1초 이르게 어긋났다."
---

## 무슨 일이

비속어 구간에 1kHz 삐를 넣는 렌더에서 첫 번째 삐만 들리고 나머지는 목소리만 지워진 채 조용했다.
삐 구간의 1kHz 에너지를 재 보니 삐는 모두 원래 자리보다 약 1초 뒤에 있었다.

## 원인

치지직 HLS 에서 `-ss 5640 -i <m3u8> -c copy` 로 받은 구간은 영상과 음성의 시작 시각이 달랐다.

```bash
ffprobe -v error -show_entries stream=codec_type,start_time -of compact clip.mp4
# stream|codec_type=video|start_time=0.001333
# stream|codec_type=audio|start_time=1.002667
```

[[ffmpeg]] 필터 그래프에서 원본 음성은 1.0초부터, `sine` 소스는 0초부터 시작한다.
`amix` 는 타임스탬프를 맞추지 않고 샘플을 앞에서부터 섞기 때문에, 삐가 음성 기준으로 1초 밀렸다.
같은 이유로 `-vn` 으로 음성만 뽑아 만든 STT 자막과 파형은 앞의 1초가 사라져 1초 일찍 찍혔다.

## 재현

```bash
ffmpeg -ss 5640 -i "$HLS" -t 90 -map 0:v:0 -map 0:a:0 -c copy clip.mp4
ffprobe -v error -show_entries stream=codec_type,start_time -of compact clip.mp4   # audio 1.0
```

## 그래서

음성을 다루는 모든 곳에서 앞의 빈 구간을 무음으로 채워 영상 0초에 맞췄다.

```bash
-af aresample=async=1:first_pts=0
```

렌더 필터 그래프의 `[0:a]` 바로 뒤, STT 용 wav 추출, 파형 추출 세 곳에 넣었다.
다시 렌더하니 삐 네 곳 모두 제자리에서 1kHz 가 -33dB 안팎으로 나왔다.

## 한 줄

> 스트림 복사로 자른 구간을 다룰 때는 먼저 `ffprobe` 로 음성·영상 `start_time` 을 비교하고, 다르면 `aresample=async=1:first_pts=0` 으로 맞춘다.
