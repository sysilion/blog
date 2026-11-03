---
title: "avg_logprob"
date: 2026-10-30T13:04:21+09:00
draft: false
tags: ["whisper", "stt"]
summary: "Whisper가 세그먼트마다 내는 값. 생성한 토큰들의 로그 확률 평균으로, 모델이 그 문장을 얼마나 확신하는지 나타낸다."
altnames: ["average log probability", "avg logprob"]
---

**avg_logprob**는 [[whisper]] 가 디코딩한 세그먼트의 토큰별 로그 확률을 평균한 값이다.

## 무엇인가

- 0에 가까울수록 모델이 그 출력을 확신한다는 뜻이다. 항상 0 이하다.
- Whisper 원본 `transcribe()` 는 `logprob_threshold`(기본 -1.0)보다 낮으면 temperature 를 올려 다시 디코딩한다.
- 같은 세그먼트에 `no_speech_prob`(말이 없을 확률), `compression_ratio`(텍스트 gzip 압축비, 반복이 많으면 커짐)가 함께 나온다.

## 알아둘 것

- 세그먼트 단위 값이다. 30초 창 하나가 여러 세그먼트로 나뉘면 같은 값이 그대로 복사돼 붙는다.
- 배경음이 계속 깔린 오디오에서는 no_speech_prob 가 0 근처에 머물 수 있다. 그럴 때 환각을 거르는 기준으로는 avg_logprob 가 낫다.
