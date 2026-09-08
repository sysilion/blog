---
title: "WebM"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["미디어", "포맷"]
summary: "Matroska의 웹용 부분집합 컨테이너. EBML 구조라 헤더 없이는 독립 디코딩이 안 된다."
altnames: ["Matroska", "MKV"]
---

Matroska 컨테이너를 웹 재생용으로 좁힌 부분집합. 브라우저 [[mediarecorder]] 의 기본 출력 포맷이고, `<video>` 가 플러그인 없이 재생하는 몇 안 되는 컨테이너다.

## 무엇인가

**Matroska**(`.mkv`)는 [[ebml]] 위에 정의된 범용 컨테이너로, 코덱 제한이 없고 자막·챕터·첨부까지 담는다. 2010년 Google이 여기서 **코덱과 기능을 못 박아** WebM(`.webm`)을 만들었다. 파일 구조는 Matroska와 같고 DocType만 `webm` 이다.

| | Matroska | WebM |
| --- | --- | --- |
| 영상 코덱 | 제한 없음 | VP8, VP9, AV1 |
| 음성 코덱 | 제한 없음 | Vorbis, Opus |
| 자막 | 다수 | WebVTT만 |
| MIME | `video/x-matroska` | `video/webm`, `audio/webm` |

## 구조

```text
EBML 헤더          DocType=webm
Segment
 ├ SeekHead         (선택) 레벨1 요소 위치
 ├ Info             TimecodeScale(기본 1ms), Duration
 ├ Tracks           트랙별 코덱 ID(V_VP9, A_OPUS…), 해상도, 채널
 ├ Cluster          Timecode + SimpleBlock…
 ├ Cluster
 │  ...
 └ Cues             (선택) 탐색 인덱스. 파일 끝에 오거나 없다
```

- **init segment** — EBML 헤더 + Segment 시작 + Info + Tracks. 첫 Cluster 직전까지. 디코더 초기화에 필요한 전부다.
- **Cluster** — `Timecode`(이 묶음의 기준 시각) 뒤에 `SimpleBlock` 들이 온다. 각 블록은 트랙 번호(VINT) · 상대 시각(16비트) · 플래그 · 프레임 데이터다. **플래그의 최상위 비트(`0x80`)가 keyframe** 이다.
- 재생은 **keyframe으로 시작하는 Cluster** 에서만 시작할 수 있다. 인코더는 보통 keyframe마다 새 Cluster를 연다.

## 알아둘 것

- **라이브로 쓴 파일은 Segment·Cluster 크기가 미정(unknown size)이고 Cues·Duration이 없다.** 브라우저 MediaRecorder 출력이 그렇다. 그래서 `<video>` 에 그대로 물리면 길이가 안 나오고 탐색이 안 된다. 파일로 보관하려면 `ffmpeg -c copy` 로 다시 묶으면 된다.
- **연속 스트림을 조각으로 자르면 두 번째 이후 조각에는 헤더가 없다.** 첫 조각에서 init segment를 떼어 보관하고 조각마다 앞에 붙이고, **keyframe으로 시작하는 Cluster 경계에서만** 잘라야 독립 디코딩된다. 이렇게 자르면 조각 길이가 요청한 timeslice와 달라지므로, 재생 순서는 시간이 아니라 **시퀀스 번호** 로 맞춰야 한다.
- MSE(`MediaSource`)도 같은 규칙을 요구한다 — 첫 `appendBuffer` 는 init segment, 이후는 Cluster 단위의 media segment.
- 브라우저별 MediaRecorder 코덱 조합은 `MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')` 로 확인한다. Safari는 WebM 녹화를 지원하지 않는 버전이 많다.
- 검증 명령:

```bash
ffprobe -v error -show_entries format=duration:stream=codec_name -of compact out.webm
ffprobe -v error -select_streams v -show_entries packet=pts_time,flags -of csv out.webm | head   # flags=K_ 가 keyframe
ffmpeg -v error -i out.webm -f null -   # 끝까지 디코딩되면 출력 없음
mkvinfo -v out.webm                     # EBML 요소 트리
```
