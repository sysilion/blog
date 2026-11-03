---
title: "ElevenLabs Scribe 무료 크레딧은 늦게 깎이고, 1초에 1크레딧 남짓 든다"
date: 2026-11-02T12:03:52+09:00
draft: false
tags: ["elevenlabs", "stt"]
summary: "Scribe v2 전사 17분에 크레딧 1,146이 들었고, 사용량은 몇 분 뒤에 한꺼번에 반영됐다."
---

## 무슨 일이

방송 하이라이트 구간을 [[elevenlabs-scribe]] v2로 전사하면서, 크레딧이 모자라면 멈추도록 `/v1/user/subscription`의 `character_count`를 구간마다 확인했다. 처음 다섯 구간(약 14분) 동안 값이 25에서 움직이지 않다가, 여섯 번째 구간 뒤에 1,171로 뛰었다. 이렇게 늦게 반영되면 크레딧이 모자라도 미리 멈추지 못한다.

## 원인

전사 사용량이 즉시 집계되지 않는다. 몇 분 단위로 모아서 한꺼번에 반영되는 것으로 보인다. 반영된 양은 20초 테스트와 2.5분 구간 6개(합계 약 1,027초)에 1,146크레딧이었다. 초당 약 1.1크레딧이다. 요청마다 `keyterms` 19개를 넣었다.

무료 플랜 한도는 한 달 10,000크레딧이다. 같은 조건이면 한 달에 약 2.5시간 분량이다.

## 재현

```bash
K=...   # Speech to Text + user_read 권한이 있는 키
curl -s -H "xi-api-key: $K" https://api.elevenlabs.io/v1/user/subscription | jq '.character_count, .character_limit'
curl -s -H "xi-api-key: $K" -F model_id=scribe_v2 -F language_code=kor \
  -F timestamps_granularity=word -F keyterms=응뇨베 -F file=@seg.mp3 \
  https://api.elevenlabs.io/v1/speech-to-text > /dev/null
# 바로 다시 조회하면 character_count 가 그대로다. 몇 분 뒤에 늘어난다.
```

키에 `user_read` 권한이 없으면 subscription 조회가 `missing_permissions`(401)로 막힌다. 전사 권한만 준 키로는 남은 양을 볼 수 없다.

## 그래서

남은 크레딧을 구간마다 확인하는 방식으로는 한도를 지킬 수 없다. 보낼 음성 길이를 합산해서 미리 예산을 세워야 한다. 품질은 같은 구간의 Whisper turbo보다 고유명사와 문장부호가 확실히 나았고, `keyterms`에 넣은 용어("응뇨베")는 교정 없이 맞았다([[contextual-biasing]]).

## 한 줄

무료 크레딧으로 돌릴 때는 `character_count`를 믿지 말고, 보낼 초 수 × 1.1로 예산을 먼저 계산한다.
