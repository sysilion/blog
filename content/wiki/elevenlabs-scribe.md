---
title: "ElevenLabs Scribe"
date: 2026-11-02T12:03:52+09:00
draft: false
tags: ["elevenlabs", "stt"]
summary: "ElevenLabs의 음성 인식 모델. 90개 넘는 언어, 단어 단위 시각, 용어 목록(keyterms)을 지원한다."
altnames: ["Scribe", "Scribe v2", "scribe_v2"]
---

ElevenLabs가 API로 제공하는 음성 인식(STT) 모델이다.

## 무엇인가

- 호출은 `POST https://api.elevenlabs.io/v1/speech-to-text`, 인증은 `xi-api-key` 헤더다. 모델은 `model_id=scribe_v2`로 고른다.
- `timestamps_granularity=word`를 주면 단어마다 `start`, `end`(초)가 붙는다. 응답의 `words` 배열에는 단어(`type: word`)와 띄어쓰기(`type: spacing`)가 섞여 있다.
- `keyterms`를 여러 번 넣어 고유명사를 알려 줄 수 있다([[contextual-biasing]]).
- 기본값에서는 `[웃음]`, `[박수]` 같은 소리 태그가 본문에 섞여 나온다.

## 알아둘 것

- 무료 플랜은 한 달 10,000크레딧이다. 전사에는 초당 1크레딧 남짓이 들어서 한 달에 2시간 반 정도 분량이다.
- API 키는 권한을 따로 고른다. 전사 권한만 주면 사용량 조회(`/v1/user/subscription`)는 `user_read`가 없다며 막힌다.
- 사용량 수치는 즉시 갱신되지 않는다.
