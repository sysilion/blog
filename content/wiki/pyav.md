---
title: "PyAV"
date: 2026-10-20T01:34:12+09:00
draft: false
tags: ["python", "미디어"]
summary: "FFmpeg 라이브러리(libav*)를 Python에서 직접 부르는 바인딩. 패키지 이름은 av."
altnames: ["av"]
---

**PyAV** 는 [[ffmpeg]] 의 C 라이브러리(libavformat·libavcodec 등)를 Cython으로 감싼 Python 바인딩이다.
PyPI 패키지 이름도, import 이름도 `av` 다.

## 무엇인가

- ffmpeg CLI를 서브프로세스로 띄우지 않고, 같은 프로세스 안에서 컨테이너를 열고 프레임 단위로 디코딩한다.
- `av.open(path)` → container → `container.decode(audio=0)` 로 프레임을 받는 식이다.
- 휠에 FFmpeg 라이브러리가 같이 들어 있어 시스템 ffmpeg가 없어도 된다.

## 알아둘 것

- 메이저 버전마다 `av.open()` 의 키워드 인자 같은 공개 API가 바뀐다. 19에서는 `metadata_errors` 가 사라졌다.
  하한만 걸어 둔 라이브러리는 새로 설치할 때 깨진다.
