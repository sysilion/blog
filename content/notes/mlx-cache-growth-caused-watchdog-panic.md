---
title: "MLX 버퍼 캐시를 비우지 않아 맥북이 새벽에 watchdog panic으로 재부팅됐다"
date: 2026-10-20T16:28:55+09:00
draft: false
tags: ["mlx", "macos", "stt", "메모리"]
summary: "mlx-whisper를 같은 프로세스에서 계속 돌리면 MLX 버퍼 캐시가 구간당 약 20MB씩 쌓인다. 16GB 맥북이 swap thrashing 끝에 커널 패닉을 냈다."
---

## 무슨 일이

새벽 2시 13분에 맥북(M1, 16GB)이 재부팅됐다. `last reboot` 기록만 있고 화면에는 아무 흔적도 없었다.
패닉 리포트는 재부팅 직후가 아니라 로그인 뒤 09:25에야 기록됐다.

```
panic(cpu 0 ...): watchdog timeout: no checkins from watchdogd in 92 seconds
```

리포트 안의 Calendar 시각(`0x6ad64f98` → 02:12:56)이 실제 패닉 시각이다. 당시 메모리 상태는 다음과 같았다.

- Python 프로세스 하나가 resident 8.4GB를 쓰고 있었다 (chicle 백엔드의 STT 작업으로 추정).
- 압축기에 약 13GB가 쌓여 있었고, free 메모리는 약 60MB였다.
- 디스크 여유 공간이 5.7GB뿐이라 swap을 더 늘릴 수 없었다.

## 원인

chicle은 [[mlx]] 위의 mlx-whisper 모델을 프로세스 안에 캐시해 두고 하이라이트 구간마다 전사한다.
구간 길이가 매번 달라 텐서 크기도 달라지므로, 다 쓴 Metal 버퍼가 재사용되지 못하고
MLX 버퍼 캐시에 계속 쌓인다. 캐시 한도는 기본값이 사실상 무제한이다.
메모리가 바닥나 swap thrashing이 이어졌고, `watchdogd` 가 92초 동안 응답하지 못해
[[watchdog-timeout-panic|watchdog timeout panic]] 이 났다.

## 재현

```python
import numpy as np, mlx.core as mx, mlx_whisper
rng = np.random.default_rng(0)
for i in range(40):
    sec = rng.uniform(5, 30)
    audio = (0.05 * rng.standard_normal(int(sec * 16000))).astype(np.float32)
    mlx_whisper.transcribe(audio, path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="ko")
    print(i, mx.get_cache_memory() / 1024**3)   # 0.54 → 1.32GB, 계속 증가
```

mlx 0.32.4, M1에서 측정했다. 40구간 동안 active 메모리는 1.51GB로 그대로였고, cache만 구간당 약 20MB씩 늘었다.
`ps` 의 RSS에는 이 메모리가 잡히지 않는다. 증가를 확인하려면 `mx.get_cache_memory()` 를 봐야 한다.

패닉 원인은 다음 명령으로 찾았다.

```bash
last reboot
ls -lt /Library/Logs/DiagnosticReports/*.panic
```

## 그래서

```python
mx.set_cache_limit(512 * 1024**2)  # 초기화 시 한 번
...
mx.clear_cache()                    # 구간마다
```

이렇게 고친 뒤 40구간을 다시 돌리자 cache는 0GB로 유지됐고, peak 메모리(1.99GB)도 수정 전과 같았다.

## 한 줄

MLX 모델을 상주시키는 서버라면 `set_cache_limit` 와 `clear_cache` 를 처음부터 넣고, 메모리는 RSS 말고 `mx.get_cache_memory()` 로 본다.
