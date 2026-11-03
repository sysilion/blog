---
title: "Nemotron Transcribe에 용어 목록을 주니 방송 밈 표기가 전부 맞았다"
date: 2026-10-29T18:11:19+09:00
draft: false
tags: ["asr", "nemotron", "vodcut"]
summary: "로쥬마리 클립 90초에서 terms 없이는 왕교자·응뇨베·샤라웃을 모두 틀렸고, 다섯 단어를 넣자 전부 맞았다. 일반 문장 인식도 같이 좋아졌다."
---

## 무슨 일이

vodcut 테스트에 쓰던 로쥬마리 클립(90초)을 [[nemotron-transcribe]] 로 받아 써 봤다.
M1 16GB 로는 로컬 실행이 안 되니(34B [[moe]], BF16 약 68GB) HF Space `mrfakename/nemotron-3.5-transcribe` 를 썼다.

용어 힌트 없이 돌리면 고유명사와 방송 밈이 [[whisper]] turbo 와 똑같이 틀렸다.

| 정답 | terms 없음 | terms 있음 | Whisper turbo |
| --- | --- | --- | --- |
| 왕교자 | 왕겨져 | 왕교자 | 왕교사 |
| 응뇨베 | 응녀 왜 | 응뇨베 | 응요배 |
| 샤라웃 | 샤나워즈 | 샤라웃 | 샤라웃 |
| 노망났나 봐 | 뭐 막 났나 봐 | 노망났나 봐 | 로망났나봐 |
| 게이가 돼줄게 | 개기가 돼줄게 | 게이가 돼줄게 | 게이가 돼줄게 |
| 등교하고 그랬어 | 등교한 거 그랬어 | 등교하고 그랬어 | 등교하고 그랬어 |

목록에 넣은 다섯 단어가 맞은 것은 예상대로였다. 목록에 없던 "노망났나 봐", "게이가", "등교하고" 까지 고쳐진 것은 뜻밖이었다.

## 원인

이 모델은 디코더가 LLM 이라 프롬프트에 넣은 용어가 디코딩 전체의 문맥이 된다([[contextual-biasing]]).
"응뇨베", "왕교자" 가 들어오면서 이 오디오가 한국 방송 잡담이라는 문맥이 잡히고, 주변 단어 선택도 그쪽으로 끌려간 것으로 본다.
샘플이 한 개라 일반화하기는 이르다.

## 재현

```bash
ffmpeg -i clip.mp4 -vn -ac 1 -ar 16000 rojumari.wav
pip install gradio_client
python - <<'PY'
from gradio_client import Client, handle_file
r = Client("mrfakename/nemotron-3.5-transcribe").predict(
    handle_file("rojumari.wav"), "Word for word", "Korean", "English",
    "로쥬마리, 왕교자, 응뇨베, 샤라웃, 비비고", True, api_name="/transcribe")
print(r[1])
PY
```

terms 를 `""` 로 바꾸면 위 표의 "terms 없음" 결과가 나온다. ZeroGPU 기준 89초 오디오에 18초가 걸렸다.

## 그래서

vodcut 은 지금 Whisper 결과를 받은 뒤 채널별 vocab 으로 사후 치환한다.
Nemotron 을 쓰면 승인된 vocab 을 디코딩 전에 terms 로 넣는 구조가 가능하다. 사후 치환으로는 못 고치는 "로망났나봐" 같은 오인식도 같이 줄어든다.
남은 확인 거리는 두 가지다. Space 출력은 문장 단위 시각뿐이라 점프컷에 쓸 단어 시각을 따로 확인해야 하고, 도입부에서 Whisper 가 받아 적은 욕설이 Nemotron 결과에는 없었다.

## 한 줄

> LLM 디코더 ASR 이 고유명사를 틀리면 사후 치환표를 만들기 전에 그 단어들을 프롬프트 용어로 먼저 넣어 본다.
