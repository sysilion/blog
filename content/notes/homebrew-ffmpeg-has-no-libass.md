---
title: "Homebrew ffmpeg에는 subtitles 필터가 없다"
date: 2026-10-27T16:47:47+09:00
draft: false
tags: ["ffmpeg", "homebrew", "영상편집"]
summary: "brew로 설치한 ffmpeg 9.0.2는 libass 없이 빌드돼 자막을 영상에 구울 수 없었다. -filter_complex_script 옵션도 사라졌다."
---

## 무슨 일이

방송 하이라이트 테스트 렌더에서 자막을 영상에 구우려고 `subtitles`·`ass` 필터를 쓰려 했다.
`ffmpeg -filters` 목록에 둘 다 없었다. 같은 렌더에서 긴 필터 그래프를 파일로 넘기는
`-filter_complex_script` 도 `Unrecognized option` 으로 실패했다.

## 원인

Homebrew 코어의 `ffmpeg` 포뮬러는 의존성을 줄여서 빌드된다. 필수 의존성 11개
(dav1d, lame, libvmaf, libvpx, openssl@4, opus, sdl2-compat, svt-av1, x264, x265, xz)에 [[libass]] 가 없다.
`-filter_complex_script` 는 9.0.2 에서 인식하지 않는다. 파일에서 옵션 값을 읽는 일반 문법
`-/옵션 파일경로` 로 같은 일을 할 수 있다.

## 재현

```bash
ffmpeg -version | head -1                    # ffmpeg version 9.0.2
ffmpeg -hide_banner -filters | grep -E ' (subtitles|ass) '   # 출력 없음
ffmpeg -hide_banner -buildconf | grep -c libass              # 0
ffmpeg -i in.mp4 -filter_complex_script g.txt out.mp4        # Unrecognized option
ffmpeg -i in.mp4 -/filter_complex g.txt out.mp4              # 동작
```

## 그래서

이번 테스트에서는 Pillow 로 자막 한 줄마다 투명 PNG 를 그리고, concat demuxer 의 `duration` 으로
이어 붙인 자막 트랙을 `overlay` 했다. 외곽선 두께와 위치를 직접 정할 수 있어서 결과는 쓸 만했다.
ASS 스타일(카라오케 강조, 애니메이션)이 필요해지면 libass 가 들어간 빌드를 따로 설치해야 한다.

## 한 줄

> brew ffmpeg 로 자막을 구워야 하면 먼저 `-buildconf | grep libass` 로 확인하고, 없으면 PNG overlay 로 가거나 libass 포함 빌드를 따로 설치한다.
