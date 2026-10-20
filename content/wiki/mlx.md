---
title: "MLX"
date: 2026-10-20T16:28:55+09:00
draft: false
tags: ["apple-silicon", "ml"]
summary: "Apple Silicon의 통합 메모리와 Metal GPU에 맞춘 Apple의 배열·머신러닝 프레임워크."
altnames: ["mlx-core", "mlx.core"]
---

**MLX**는 Apple이 만든 Apple Silicon 전용 배열·머신러닝 프레임워크다. NumPy와 비슷한 API로 Metal GPU에서 연산한다.

## 무엇인가

- CPU와 GPU가 **통합 메모리**를 함께 쓰므로 데이터를 복사할 필요가 없다.
- 연산은 지연 평가(lazy)된다. `mx.eval()` 을 부르거나 값을 꺼낼 때 실제로 계산한다.
- mlx-whisper, mlx-lm 같은 모델 패키지가 이 위에서 돈다.

## 알아둘 것

**버퍼 캐시.** 다 쓴 Metal 버퍼를 바로 돌려주지 않고 재사용하려고 캐시에 보관한다.
캐시 한도의 기본값은 메모리 한도와 같아서 사실상 제한이 없다. 입력 크기가 매번 달라지는
작업을 한 프로세스에서 계속 돌리면, 재사용되지 못한 버퍼가 쌓여 캐시가 계속 커진다.

```python
mx.get_active_memory()   # 살아 있는 배열
mx.get_cache_memory()    # 캐시에 보관된 버퍼
mx.set_cache_limit(n)    # 캐시 상한 (bytes)
mx.clear_cache()         # 캐시 비우기
```

이 메모리는 `ps` 의 RSS에 잡히지 않는다. 증가를 추적하려면 위 API를 써야 한다.
