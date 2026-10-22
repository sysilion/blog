---
title: "wheel"
date: 2026-10-20T01:40:35+09:00
draft: false
tags: ["python", "packaging"]
summary: "Python 패키지의 미리 빌드된 배포 형식(.whl). 파일명에 호환 가능한 Python·ABI·플랫폼이 박혀 있다."
altnames: ["whl", "Python wheel"]
---

**wheel**은 설치 시 빌드 과정 없이 압축만 풀면 되는 Python 패키지 배포 형식(`.whl`)이다. PEP 427.

## 구조

파일명이 곧 호환성 선언이다.

```
torch-2.14.1-cp314-cp314-macosx_14_0_arm64.whl
 이름  버전   Python ABI   플랫폼
```

- Python 태그: `cp314` = CPython 3.14, `py3` = 순수 Python
- [[abi-tag|ABI 태그]]: 확장 모듈이 링크되는 바이너리 인터페이스. `abi3` 는 여러 버전 공용
- 플랫폼 태그: `macosx_14_0_arm64`, `manylinux_2_28_x86_64`, `any`

## 알아둘 것

- 네이티브 확장(C/C++/Rust)이 있는 패키지는 Python 마이너 버전마다 wheel을 새로 올려야 한다. 새 버전 지원이 늦는 이유다.
- 맞는 wheel이 없으면 설치기는 sdist(소스)로 넘어가 빌드를 시도한다. `--only-binary :all:` 로 막으면 wheel 유무가 바로 드러난다.
- `abi3` wheel은 하나로 여러 Python 버전을 지원하므로 새 버전에서도 바로 설치된다.
