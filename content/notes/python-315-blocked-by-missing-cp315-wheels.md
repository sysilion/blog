---
title: "Python 3.15로 못 올리는 건 torch·ctranslate2에 cp315 wheel이 없어서다"
date: 2026-10-20T01:40:35+09:00
draft: false
tags: ["python", "uv", "packaging"]
summary: "torch 2.14.1·ctranslate2 4.8.3은 cp314까지만 wheel을 낸다. 3.15 venv에서는 설치 자체가 안 된다."
---

## 무슨 일이

`~/proj` 의 [[venv]] 들을 Python 3.15로 맞추려 했다. `naver` 는 이미 3.15였지만
`AutoMMD`(torch), `chicle`(STT용 [[faster-whisper]])은 의존성 해석부터 실패했다.

## 원인

[[wheel]] 은 [[abi-tag|ABI 태그]](`cp312`, `cp314` …)별로 따로 빌드된다. 2026-10-20 기준:

| 패키지 | 확인한 버전 | 3.15(`cp315`) wheel |
| --- | --- | --- |
| `torch` | 2.14.1 (최신) | 없음 (`cp310`~`cp314`, `cp314t`) |
| `ctranslate2` | 4.8.3 (최신) | 없음 → `faster-whisper` 전 버전 설치 불가 |
| `pandas` | 2.3.3 (chicle 고정) | 없음. 3.0.6부터 있음 |
| `pydantic-core` | 2.41.5 (chicle 고정) | 없음. 2.50.1(`pydantic` 2.14.1)부터 있음 |
| `mediapipe` | 1.1.1 | 있음 |

인터프리터 버전을 올리면 ABI 태그가 바뀌므로, 버전을 고정(`==`)해 둔 패키지는
새 태그용 wheel이 없는 경우가 많다. 소스 빌드는 컴파일러·의존 라이브러리가 필요해 사실상 막힌다.

## 재현

```bash
uv venv -p python3.15 /tmp/v315
uv pip install --dry-run --only-binary :all: -p /tmp/v315/bin/python torch
# hint: You require CPython 3.15 (`cp315`), but we only found wheels for
# `torch` (v2.14.1) with the following Python ABI tags: ... `cp314`, `cp314t`

# 다른 버전 기준으로 미리 보기 (venv 없이도 대상 버전 지정 가능)
uv pip install --dry-run --only-binary :all: \
  --python-version 3.14 --python-platform aarch64-apple-darwin -p /tmp/v315/bin/python ctranslate2
```

`--only-binary :all:` 을 빼면 uv가 sdist로 해석을 "성공"시켜 버려 문제가 가려진다.

## 그래서

기존 venv를 지우기 전에 `--dry-run --only-binary :all:` 로 새 버전에서 해석되는지 먼저 본다.
지금 맞출 수 있는 최신은 3.14다.

**한 줄:** 새 Python으로 올릴 수 있는지는 인터프리터가 아니라 가장 느린 네이티브 패키지의 wheel이 정한다.
