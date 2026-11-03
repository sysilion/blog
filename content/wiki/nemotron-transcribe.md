---
title: "Nemotron Transcribe"
date: 2026-10-29T18:11:19+09:00
draft: false
tags: ["asr", "stt", "nvidia"]
summary: "NVIDIA의 오디오 인코더 + MoE LLM 디코더 음성 모델. 40개 언어 전사·번역·화자 분리·오디오 질의응답을 한다."
altnames: ["Nemotron 3.5 Transcribe", "NVIDIA-Nemotron-3.5-Transcribe-30B-A4B"]
---

**Nemotron Transcribe**는 NVIDIA가 공개한 오프라인 음성 모델로, 오디오 인코더 뒤에 [[moe]] 언어 모델을 붙여 텍스트를 생성한다.

## 무엇인가

- 3.5 버전 체크포인트는 `nvidia/NVIDIA-Nemotron-3.5-Transcribe-30B-A4B`. 전체 약 34B, 토큰당 활성 약 4.3B 파라미터다.
- 한국어를 포함한 40개 언어. 전사, 영어와의 상호 번역, 화자 분리 전사, 오디오 질의응답을 지시문(instruction)으로 바꿔 가며 한다.
- 컨텍스트 65,536 토큰, 최대 1시간 오디오.
- 실행 경로는 vLLM + NeMo Speech 플러그인(권장), Transformers, SGLang-Omni. FP8, NVFP4 양자화본이 따로 있다.
- 라이선스는 OpenMDW-1.1. 상업 사용 가능.

## 알아둘 것

- 활성 파라미터는 작아도 가중치 전체를 메모리에 올려야 한다. BF16 약 68GB라서 H100/A100 80GB 급이 기준이고, Apple Silicon 공식 지원은 없다.
- 디코더가 LLM 이라 용어 목록이나 상황 설명을 프롬프트로 넣는 [[contextual-biasing]] 이 된다.
- 직접 돌릴 수 없으면 Hugging Face Space(ZeroGPU)를 `gradio_client` 로 호출해 시험할 수 있다.
