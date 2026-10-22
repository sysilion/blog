---
title: "huggingface_hub 2.x 캐시는 모델 폴더를 지워도 용량이 안 돌아온다"
date: 2026-10-20T09:43:04+09:00
draft: false
tags: ["huggingface", "python", "디스크"]
summary: "실제 파일은 hub/blobs/ 공용 폴더에 있고 모델 폴더에는 심볼릭 링크만 있다. rm -rf로 모델을 지우면 5GB가 고아로 남는다."
---

## 무슨 일이

STT 모델 여러 개를 번갈아 받아 벤치마크하면서, 끝난 모델은 `rm -rf ~/.cache/huggingface/hub/models--…` 로
지웠다. 그런데 남은 공간은 늘지 않고 계속 줄었다. 3GB를 지웠는데 0.2GB만 돌아왔고, 디스크가 1GB 아래까지 떨어져
다른 프로세스가 공간을 먹고 있다고 의심했다.

## 원인

[[huggingface-hub-cache]] 의 2.x(xet) 레이아웃에서는 실제 파일이 허브 공용 `hub/blobs/` 에 있다.
모델 폴더 쪽은 두 단계 심볼릭 링크뿐이다.

```
models--X/snapshots/<rev>/model.safetensors -> ../../blobs/<sha>
models--X/blobs/<sha>                         -> ../../blobs/11/<sha256>   # hub/blobs/
```

모델 폴더를 통째로 지우면 링크만 사라지고, 링크를 잃은 파일은 `hub/blobs/` 에 그대로 남는다.
이번에 남은 고아 파일은 18개, 5.3GB였다. 공간이 계속 줄던 원인도 다른 프로세스가 아니라 이것이었다.

## 재현

```bash
du -sh ~/.cache/huggingface/hub/blobs          # 7.9G
rm -rf ~/.cache/huggingface/hub/models--mlx-community--Qwen3-ASR-1.7B-8bit
du -sh ~/.cache/huggingface/hub/blobs          # 그대로
```

어느 모델 폴더의 링크도 가리키지 않는 파일을 찾아 지웠다.

```python
import os
hub = os.path.expanduser("~/.cache/huggingface/hub"); blobs = os.path.join(hub, "blobs")
used = {os.path.realpath(os.path.join(r, f))
        for r, ds, fs in os.walk(hub) if not r.startswith(blobs)
        for f in fs + ds if os.path.islink(os.path.join(r, f))}
for r, _, fs in os.walk(blobs):
    for f in fs:
        p = os.path.join(r, f); base = p[:-5] if p.endswith(".refs") else p
        if os.path.realpath(base) not in used:
            os.remove(p)
```

그 결과 `blobs` 는 7.9GB에서 3.0GB로 줄었고, 남은 모델은 모두 정상적으로 다시 로드됐다.

## 한 줄

> HF 캐시에서 모델을 지운 뒤에는 모델 폴더 말고 `hub/blobs` 를 `du` 해서 줄었는지 본다. 모델 폴더를 `du -L` 로 재면 링크 너머까지 세서 파일이 거기 있는 것처럼 보인다.
