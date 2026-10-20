---
title: "Whisper"
date: 2026-10-20T16:43:57+09:00
draft: false
tags: ["stt", "ml"]
summary: "OpenAI의 다국어 음성 인식 모델. 30초 창 단위로 log-mel을 넣어 텍스트와 시각을 생성한다."
altnames: ["OpenAI Whisper", "mlx-whisper", "whisper-large-v3-turbo"]
---

**Whisper**는 OpenAI가 공개한 인코더-디코더 구조의 다국어 음성 인식 모델이다.

## 무엇인가

- 입력은 16kHz mono 오디오의 log-mel 스펙트로그램이다. large-v3 계열은 128 mel bin을 쓴다.
- **30초 창** 단위로 디코딩한다. 긴 오디오는 창을 밀어 가며 처리하고, 마지막 창은 0으로 패딩한다.
- 출력은 텍스트와 세그먼트별 `start`/`end` 시각이다.
- 구현체로 원본(PyTorch), [[faster-whisper]](CTranslate2), mlx-whisper([[mlx]]) 등이 있다.

## 알아둘 것

- 무음이나 패딩 구간에서 앞 문맥을 반복하는 **환각**을 낸다. 세그먼트 시각이 입력 길이를 넘기도 한다.
- mlx-whisper의 `transcribe()` 는 디코딩 전에 **오디오 전체**의 log-mel을 한 번에 계산한다.
  긴 오디오는 미리 잘라서 넣어야 한다.
