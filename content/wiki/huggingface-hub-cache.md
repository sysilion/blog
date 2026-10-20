---
title: "Hugging Face Hub 캐시"
date: 2026-10-20T09:43:04+09:00
draft: false
tags: ["huggingface", "python"]
summary: "huggingface_hub가 모델을 내려받아 두는 ~/.cache/huggingface/hub. 실제 파일과 이름표가 분리돼 있다."
altnames: ["HF cache", "huggingface cache", "HF_HOME"]
---

**Hugging Face Hub 캐시**는 `huggingface_hub` 가 저장소 파일을 내려받아 두는 로컬 디렉터리다.
기본 위치는 `~/.cache/huggingface/hub`, `HF_HOME` 이나 `HF_HUB_CACHE` 로 옮길 수 있다.

## 구조

```
hub/
  models--<org>--<name>/
    refs/main                 # 브랜치 → 커밋 해시
    snapshots/<rev>/<file>    # 사람이 보는 이름 (심볼릭 링크)
    blobs/<sha>               # 파일 내용
  blobs/                      # 2.x(xet): 실제 내용이 모이는 공용 저장소
```

- `snapshots/` 는 파일 이름을 내용 해시에 연결하는 이름표다. 같은 내용은 리비전이 달라도 한 번만 저장된다.
- 2.x에서는 모델별 `blobs/<sha>` 도 다시 공용 `hub/blobs/` 를 가리키는 링크일 수 있다.
- 받다 만 파일은 `*.incomplete` 로 남는다.

## 알아둘 것

- 모델 폴더를 `rm -rf` 해도 공용 `hub/blobs/` 의 실제 파일은 남는다. 용량을 확인하려면 `hub/blobs` 를 직접 재야 한다.
- `du -sh models--X` 는 링크 크기만 센다. 모델 실제 크기는 `du -shL models--X/snapshots` 로 잰다.
