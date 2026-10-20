---
title: "Whisper의 condition_on_previous_text를 끄자 반복 환각이 사라지고 2.7배 빨라졌다"
date: 2026-10-20T19:52:45+09:00
draft: false
tags: ["stt", "whisper", "mlx"]
summary: "앞 문장을 다음 창의 프롬프트로 넘기는 기본값 때문에 '와'·'히' 같은 반복이 창을 따라 번졌다. 끄면 같은 10분 조각이 119초에서 45초로 줄었다."
---

## 무슨 일이

chicle에서 같은 VOD 20분 구간을 여러 번 전사했는데, 돌릴 때마다 발화 수가 480개, 534개, 663개로 달랐다.
663개가 나온 실행에는 `히` 81번, `나` 70번, `아` 55번 같은 반복이 조각 중간에 몰려 있었다.
조각 오디오는 세 번 받아도 md5가 같았다. 그러니 차이는 디코딩 쪽에서 생긴다.

## 원인

[[whisper]] 의 `transcribe()` 는 기본값이 `condition_on_previous_text=True` 다. 앞 30초 창에서 나온 문장을
다음 창의 프롬프트로 넘기는데, 한 번 반복이 생기면 그 반복이 프롬프트를 타고 다음 창으로 번진다.
반복이 생기면 압축률 검사에 걸려 temperature fallback(0.2, 0.4, … 로 다시 샘플링)이 돈다. 그래서 느려지고, 결과도 실행마다 갈린다.

## 재현

같은 10분 조각(16kHz mono)에 mlx-whisper large-v3-turbo를 설정마다 두 번씩 돌렸다 (M1, mlx 0.32.4).

```python
mlx_whisper.transcribe(audio, path_or_hf_repo="mlx-community/whisper-large-v3-turbo",
                       language="ko", condition_on_previous_text=False)
```

| 설정 | 시간 | 발화 | 최다 반복 |
| --- | --- | --- | --- |
| 기본값 | 119초 | 185 | `와` 6회 |
| `condition_on_previous_text=False` | 45초 | 171 | 2회 |
| `temperature=0.0` (fallback 끔) | 54초 | 463 | **`와` 404회** |

같은 프로세스 안에서 같은 설정으로 두 번 돌리면 결과 해시가 같았다.

## 그래서

`condition_on_previous_text=False` 로 바꿨다. 20분 구간 전체 전사가 4분 6초에서 2분 37초로 줄었고,
가장 많이 반복된 줄은 `아..` 10회였다. fallback을 끄는 건 오히려 해롭다. 반복을 끊어 주던 장치가 사라져
`와` 가 404번 찍혔다.

**한 줄:** 긴 방송 전사에서는 앞 문맥 전달부터 끈다. temperature fallback은 끄지 않는다.
