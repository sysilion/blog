---
title: "faster-whisper"
date: 2026-10-20T01:34:12+09:00
draft: false
tags: ["stt", "python"]
summary: "OpenAI Whisper를 CTranslate2로 다시 구현한 로컬 음성 인식 라이브러리. torch 없이 돈다."
altnames: ["faster_whisper"]
---

**faster-whisper** 는 OpenAI Whisper 모델을 CTranslate2 추론 엔진으로 다시 구현한 Python 라이브러리다.
같은 모델을 원본보다 빠르고 적은 메모리로 돌리며, torch 없이 설치된다.

## 구조

- `WhisperModel(model_id, device, compute_type)` — 모델은 Hugging Face에서 처음 쓸 때 내려받는다.
  `base` 는 수백 MB, `large-v3` 는 약 3GB.
- `transcribe(audio)` 는 `(segments 제너레이터, info)` 를 돌려준다. 실제 추론은 제너레이터를 돌 때 일어난다.
- `audio` 에는 파일 경로나 파일 객체, 또는 **16kHz mono float32 numpy 배열**을 넘길 수 있다.
  경로나 파일 객체를 넘기면 [[pyav]] 로 디코딩·리샘플링한다. 배열을 넘기면 그 단계를 건너뛴다.
- `vad_filter=True` 는 Silero VAD로 무음 구간을 잘라 낸 뒤 전사한다.

## 알아둘 것

- CTranslate2는 Apple Metal(MPS)을 지원하지 않는다. Apple Silicon에서는 CPU(`int8`)로만 돈다.
- PyAV 의존성이 `av>=11` 하한뿐이라, 최신 PyAV의 API 변경에 그대로 노출된다.
