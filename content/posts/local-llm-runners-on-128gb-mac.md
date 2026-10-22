---
title: "128GB 맥에서 로컬 LLM 실행기 갈아타기"
date: 2026-10-22T10:14:30+09:00
draft: false
tags: ["llm", "macos", "mlx", "벤치마크", "삽질"]
summary: "DeepSeek 전용 엔진을 지우고 Qwen3.8-Flash-Next 와 Raon-1 mini 를 llama.cpp, Strata, MLX 로 돌려 봤다. 같은 모델도 실행기에 따라 초당 토큰이 1.5배 넘게 갈렸다."
---

M4 Max 128GB 맥에서 DeepSeek V4 Flash 를 [ds4](https://github.com/antirez/ds4) 로 돌리고 있었다.
ds4 는 DeepSeek 하나만 보고 만든 엔진이라 다른 모델은 못 올린다. 새 모델을 써 보려고 통째로
지우고 다시 꾸몄다. 하루 동안 모델 둘, 실행기 셋을 갈아 끼웠고 그 기록이다.

순서는 거꾸로 했다. 새 쪽이 도는 걸 먼저 확인하고 나서 ds4 를 지웠다. 지울 폴더가 97GB 였고
그중 86GB 짜리 모델과 17GB 짜리 KV 캐시는 git 으로 되살릴 수 없다. 디스크가 남는다면
잠깐 둘 다 두는 쪽이 싸다.

## 몇 GB 까지 올릴 수 있나

통합 메모리가 128GB 여도 GPU 가 그만큼 다 쓰지는 못한다. macOS 는 한 프로세스가 GPU 용으로
붙잡아 둘 수 있는 양에 상한을 두고, 그게 대략 4분의 3 이다. Strata 문서는 128GB M5 Max 에서
107.5GB 로 쟀다. 모델 고르기는 이 숫자에서 시작한다.

이 맥에는 다른 계정이 Ollama 로 gemma4 를 띄워 두고 있었다. 그게 42GB 를 쥐고 있어서
실제 여유는 더 적었다. 남의 프로세스라 건드리지 않고 그대로 둔 채 쟀다. 아래 숫자는 전부
그 42GB 가 옆에 있는 상태다.

## Qwen3.8-Flash-Next

전체 125B 짜리 [[moe]] 다. 토큰 하나를 만들 때 실제로 계산하는 건 6B 쯤이다. 특이하게
28.8GB 짜리 n-gram 표가 별도 파일로 붙는다.

기본 추천인 Q4_K_M 은 120GB 라 들어가지 않는다. ISTA-DASLab 의 IQ3_S 를 골랐다.
본체 54.8GB 에 n-gram 표 28.8GB, 합쳐 84GB 다. n-gram 표는 매 토큰 몇 줄씩만 읽으니
GPU 메모리에 올리지 않고 `mmap` 으로 SSD 에 둔다.

```bash
llama-server -m Qwen3.8-Flash-Next-GSQ-RCO-IQ3_S-00001-of-00002.gguf \
  -lm mmap --lazy-mode on -ngl 99 -c 32768 --jinja --host 0.0.0.0 --port 5000
```

Homebrew 의 llama.cpp 0.7.0 이 이 구조(`qwen4exp`)를 이미 안다. 별도 빌드는 필요 없었다.

### Strata

이 모델만 보고 만든 실행기로 [Strata](https://github.com/Niko1221/Strata) 가 있다. 원래 목적은
VRAM 8~12GB 짜리 NVIDIA 카드에서 이 모델을 돌리는 것이다. 토큰마다 필요한 전문가만 RAM 이나
SSD 에서 실어 나른다.

모델이 통째로 GPU 메모리에 올라가는 맥이라면 실어 나를 게 없으니 이점이 없겠다고 생각했다.
틀렸다. 저장소의 `docs/MAC.md` 에 M5 Max 측정이 있었는데 IQ3_S 에서 llama.cpp 51 tok/s,
Strata 75 tok/s 였다. 직접 쟀다.

`./setup.sh` 는 이미 받은 파일을 `--gguf-dir` 로 넘기면 다시 받지 않는다. 빌드에 몇 분,
MTP 초안 층을 원본 체크포인트에서 뽑아 오는 데 몇 분 걸린다.

```bash
./setup.sh --model IQ3_S --gguf-dir ~/qwen38/models/IQ3_S --yes --no-start --vision no
```

## 재는 법

둘 다 OpenAI 호환 API 라 같은 스크립트를 양쪽에 보냈다. 스트리밍으로 받고, 첫 토큰이 온
뒤부터 끝날 때까지의 시간으로 생성 속도를 낸다. 첫 토큰까지의 시간은 프롬프트 읽는 속도로 본다.

```python
# 200 토큰 생성, temperature 0, 예열 한 번 뒤 두 번
decode_tps = (n_out - 1) / (t_end - t_first)
# 프롬프트: 같은 문장 250줄을 붙인 긴 입력
prompt_tps = n_in / (t_first - t_start)
```

## 결과: Qwen3.8-Flash-Next IQ3_S

| | llama.cpp 0.7.0 | Strata 0.2.2 |
| --- | --- | --- |
| 생성 (200 토큰) | 41.4 / 42.2 tok/s | 62.6 / 62.8 tok/s |
| 프롬프트 4,954 토큰 | 9.26초 (535 tok/s) | 첫 번째 16.6초, 두 번째 7.9초 (626 tok/s) |
| 프로세스 메모리 | 약 54GB | 약 58GB |

생성은 Strata 가 1.5배 빨랐다. 이유는 두 겹이다. 하나는 이 모델 전용으로 짠 Metal 커널이다.
문서의 M5 Max 표에서 MTP 를 꺼도 Strata 가 75 tok/s, llama.cpp 가 51 tok/s 다. 다른 하나는
MTP 다. 작은 초안 층이 다음 토큰 몇 개를 미리 찍고 본 모델이 한 번에 검사해서, 맞은 만큼
한 걸음에 여러 토큰이 나온다. 본 모델이 전부 검사하니 출력은 MTP 없이 돌린 것과 토큰 단위로
같다.

Strata 의 첫 프롬프트가 느린 건 켜자마자 macOS 가 모델 파일을 디스크에서 읽어 들이는 중이라
그렇다. 두 번째부터 제 속도가 나온다. llama.cpp 쪽은 프롬프트를 한 번만 쟀으니 이 줄은
맞대어 보기 어렵다.

## Raon-1 mini preview

KRAFTON 이 10월 21일에 Apache 2.0 으로 공개한 모델이다. 전체 28.8B, 토큰마다 128개 전문가 중
6개와 공용 전문가 하나가 돌아 활성 파라미터는 4B 남짓이다. 한국어 대화를 내세운다.

구조 이름은 `raon1` 인데 정식 llama.cpp 에는 아직 없다. 모델 카드가 안내하는 KRAFTON
브랜치를 따로 빌드했다. Homebrew 의 `llama-server` 와 경로가 겹치지 않게 다른 폴더에 뒀다.

```bash
git clone -b raon-1-mini-preview --depth 1 https://github.com/krafton-ai/llama.cpp
cmake -B build -DGGML_METAL=ON && cmake --build build -j --target llama-server
```

메모리가 남으니 가장 큰 Q8_0(30.7GB)을 받았다. 초안 모델 DFlash(0.7GB)도 같이 붙였다.

```bash
llama-server -m raon-1-mini-preview-Q8_0.gguf \
  -md dflash-raon-1-mini-preview-Q8_0.gguf \
  --spec-type draft-dflash --spec-draft-n-max 7 --spec-draft-sampling probabilistic \
  -ngl 99 --reasoning on \
  --chat-template-kwargs '{"enable_thinking": true, "truncate_history_thinking": false}'
```

로그에 `dflash requires ctx_other to be set` 가 에러(`E`)로 찍힌다. 같은 줄 끝에 메모리를
맞추는 동안에는 정상이라고 적혀 있고, 몇 줄 뒤에 초안 모델이 실제로 붙는다.

### MLX 판

[[mlx]] 판도 따로 올라와 있다. 품질은 같을 줄 알았는데 받아 보니 NVFP4, 즉 4비트였다.
Q8_0 과는 압축 정도가 다르다.

| | llama.cpp Q8_0 + DFlash | MLX NVFP4 |
| --- | --- | --- |
| 생성 (200 토큰) | 58.3 / 58.5 tok/s | 102.1 / 102.2 tok/s |
| 프롬프트 3,268 토큰 | 3.20초 | 2.55초 |
| 크기 | 30.7GB | 17.5GB |

초안 모델 없이도 MLX 가 1.75배 빨랐다. 이 크기의 MoE 는 토큰마다 가중치를 메모리에서 읽어
오는 게 병목이라, 가중치가 절반이면 읽을 양도 절반이다. 4비트로 줄인 만큼 품질을 잃었는지는
KRAFTON 이 숫자를 내지 않아 모른다. 활성 4B 짜리 모델은 양자화에 더 민감할 수 있으니
어려운 추론에서는 Q8_0 과 비교해 볼 생각이다.

프롬프트 토큰 수가 Qwen 쪽과 다른 건 같은 글을 토크나이저가 다르게 잘라서다.
글 하나 기준으로는 Raon-1 MLX 가 2.55초, Qwen Strata 가 7.9초였다.

## 걸린 것 둘

### mlx_lm 서버는 요청의 model 이름을 내려받는다

`mlx_lm server` 는 요청 본문의 `model` 값을 Hugging Face 저장소 이름으로 보고 없으면
내려받아 올린다. `"model": "Raon-1-mini-preview"` 를 보냈더니 로그에 이게 찍혔다.

```
GET https://huggingface.co/api/models/Raon-1-mini-preview/revision/main "HTTP/1.1 404 Not Found"
```

이 모델은 `--trust-remote-code` 가 있어야 뜬다. 저장소에 딸린 파이썬 코드를 실행한다는 뜻이다.
`0.0.0.0` 으로 열어 두면 같은 네트워크의 누구든 아무 저장소 이름을 보내 그 코드를 이 맥에서
돌리게 만들 수 있다.

이름이 뭐든 로컬 모델로 고정하는 래퍼를 씌웠다.

```python
from mlx_lm import server

_load = server.ModelProvider.load

def _load_local_only(self, model_path, adapter_path=None, draft_model_path=None):
    return _load(self, "default_model", None, "default_model")

server.ModelProvider.load = _load_local_only
server.main()
```

`gpt-4`, `Raon-1-mini-preview`, `default_model` 셋 다 로컬 모델이 답했고 Hugging Face 로
나가는 요청은 더 없었다. llama.cpp 시절 별칭을 보내던 클라이언트도 덕분에 그대로 붙는다.

### zsh 는 HOST 를 미리 채운다

실행 스크립트에 `--host "${HOST:-0.0.0.0}"` 를 적었는데 서버가 `[::1]:5000` 에만 떴다.
zsh 는 셸 변수 `HOST` 에 호스트 이름을 넣어 두므로 기본값이 쓰일 일이 없다.

```bash
zsh -c 'echo $HOST'    # 호스트 이름이 나온다
```

변수 이름을 `BIND` 로 바꿨다. bash 에는 없는 변수라 bash 로 옮겨 보면 멀쩡히 돌아서 더 헷갈린다.

## 정리

| 모델 | 실행기 | 생성 tok/s |
| --- | --- | --- |
| Qwen3.8-Flash-Next IQ3_S | llama.cpp | 42 |
| Qwen3.8-Flash-Next IQ3_S | Strata (MTP) | 63 |
| Raon-1 mini Q8_0 | llama.cpp KRAFTON 브랜치 (DFlash) | 58 |
| Raon-1 mini NVFP4 | MLX | 102 |

Qwen 은 같은 파일을 실행기만 바꿔서 1.5배가 났다. Raon-1 은 양자화까지 같이 바뀌어서 1.75배를
전부 MLX 몫으로 볼 수는 없다. 범용 llama.cpp 는 처음 띄워 보기에 제일 편했고, 두 모델 모두에서
가장 느렸다.

> 맥에 새 모델을 올릴 때는 모델 전용 실행기나 MLX 판이 있는지부터 찾는다.
