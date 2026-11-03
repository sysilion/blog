---
title: "Whisper turbo 반복 환각은 no_speech_prob 로는 안 걸리고 avg_logprob 로 걸린다"
date: 2026-10-30T13:04:21+09:00
draft: false
tags: ["whisper", "stt", "vodcut"]
summary: "방송 VOD 21시간 전사에서 한 단어를 1분 동안 수십 번 반복하는 구간이 37분 나왔다. no_speech_prob 는 전부 0이었고, avg_logprob 가 -1 아래인지로 갈렸다."
---

## 무슨 일이

로쥬마리 다시보기 5편(약 21시간)을 30분 단위로 잘라 [[whisper]] turbo(mlx-whisper 0.4.3, `condition_on_previous_text=False`)로 전사했다.
게임 소리나 배경음악만 나오는 구간에서 짧은 단어 하나가 1분 안에 수십 번 찍혔다. "전전자" 43번, "지자" 50번, "정원" 49번, "위대" 38번 같은 식이다.
앞 문맥을 넘기지 않게 꺼 뒀는데도 생겼다.

레인보우 식스 시즈 VOD에서는 게임 내 일본어 음성("突入まで10秒")과 같이 본 애니 대사도 일본어로 받아 적혔다. `language="ko"` 를 줘도 막히지 않는다.

## 원인

반복 구간(앞뒤 10세그먼트 안에 같은 짧은 문장 5번 이상)과 나머지 세그먼트를 나눠 Whisper 가 내는 신뢰도 값을 비교했다.

| | 세그먼트 | no_speech_prob 중앙값 | [[avg-logprob\|avg_logprob]] 중앙값 | avg_logprob < -1 비율 |
| --- | --- | --- | --- | --- |
| 반복 구간 | 2,188 | 0.0 | -1.34 | 75% |
| 나머지 | 19,278 | 0.0 | -0.40 | 5% |

no_speech_prob 는 두 집단 모두 0이라 쓸모가 없었다. 배경음이 계속 깔려 있어 모델이 "말이 있다"고 판단한 것으로 본다(검증은 안 했다).
avg_logprob 는 두 집단이 확실히 갈렸다.

## 재현

```python
import mlx_whisper
r = mlx_whisper.transcribe("chunk.m4a", path_or_hf_repo="mlx-community/whisper-large-v3-turbo",
                           language="ko", condition_on_previous_text=False)
for s in r["segments"]:
    print(round(s["no_speech_prob"], 3), round(s["avg_logprob"], 2), s["text"])
# 반복 구간: 0.0 -1.34 전전자 / 0.0 -1.34 전전자 / ...
```

## 그래서

환각을 걸러 내려면 avg_logprob < -1 과 "같은 짧은 문장 연속 반복"을 같이 본다. 하나만 쓰면 소리 지르기·감탄사 같은 정상 구간까지 지워진다.
게임 음성처럼 다른 언어로 찍힌 세그먼트는 한글이 아닌 문자(한자·가나) 비율로 따로 걸러야 한다.

## 한 줄

> Whisper 출력에서 같은 단어가 줄줄이 나오면 no_speech_prob 말고 avg_logprob 부터 찍어 본다.
