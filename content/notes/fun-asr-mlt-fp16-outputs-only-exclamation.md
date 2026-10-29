---
title: "Fun-ASR-MLT-Nano를 fp16으로 MLX 변환하면 느낌표만 나온다"
date: 2026-10-27T18:03:39+09:00
draft: false
tags: ["mlx", "asr", "fun-asr"]
summary: "fp16 변환본은 모든 입력에 '!!!!'를 냈다. bfloat16으로 다시 변환하니 정상이었다. 긴 오디오는 직접 잘라 넣어야 한다."
---

## 무슨 일이

`FunAudioLLM/Fun-ASR-MLT-Nano-2512` 는 MLX 변환본이 없어서 mlx-audio 의 변환기로 직접 바꿨다.
`--dtype float16` 으로 만든 모델은 한국어, 중국어 예제 모두에서 `!!!!…` 만 512자 내놓았다.

## 원인

`!` 는 Qwen 토크나이저의 0번 토큰이다. 로짓이 전부 NaN 이면 argmax 가 0번을 고르므로 느낌표가 끝없이 나온다.
이 모델의 LLM 부분(Qwen3-0.6B)은 원본 설정이 `llm_dtype: bf16` 이다. 활성값이 [[bfloat16]] 범위를 전제로 학습돼 있어서
fp16 의 좁은 지수 범위(최대 약 65504)를 넘는 순간 inf, 그다음 NaN 이 된 것으로 본다.
같은 변환기에 기본값(`bfloat16`)을 쓰니 예제 두 개가 정답과 같은 문장으로 나왔다.

## 재현

```bash
python -m mlx_audio.stt.models.fun_asr_nano.convert \
  --hf-path FunAudioLLM/Fun-ASR-MLT-Nano-2512 --mlx-path out --dtype float16
python -c "from mlx_audio.stt import load; print(load('out').generate('out/example/ko.mp3', language='韩文').text)"
# !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!...

# --dtype bfloat16 (기본값) 으로 다시 변환하면
# 조금만 생각을 하면서 살면 훨씬 편할 거야.
```

변환이 끝나도 3분짜리 오디오를 통째로 넣으면 앞부분 몇 문장 뒤에 `음...` 이 수백 번 반복됐다.
이 런타임은 긴 입력을 스스로 나누지 않는다. 무음 지점에서 25초 이하로 잘라 넣으니 반복이 사라졌다.

## 그래서

Qwen 계열 LLM 이 들어간 음성 모델은 fp16 대신 bf16 으로 변환한다. 출력이 한 글자 반복이면 dtype 부터 의심한다.

## 한 줄

> MLX 변환 결과가 같은 기호만 반복하면 원본 config 의 dtype 을 확인하고 그 dtype 으로 다시 변환한다.
