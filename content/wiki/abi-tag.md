---
title: "ABI 태그"
date: 2026-10-20T01:40:35+09:00
draft: false
tags: ["python", "packaging"]
summary: "wheel이 어떤 CPython 바이너리 인터페이스용으로 빌드됐는지 나타내는 태그(cp314, abi3 등)."
altnames: ["ABI tag", "cp315", "abi3"]
---

**ABI 태그**는 [[wheel]] 안의 컴파일된 확장 모듈이 어느 CPython 바이너리 인터페이스(ABI)에 맞춰 빌드됐는지 나타낸다. PEP 425.

## 무엇인가

| 태그 | 의미 |
| --- | --- |
| `cp314` | CPython 3.14 전용 ABI |
| `cp314t` | CPython 3.14 free-threaded(GIL 없음) 빌드 |
| `abi3` | Stable ABI. 명시된 최소 버전 이상 모든 CPython 3.x |
| `none` | 확장 모듈 없음 (순수 Python) |

## 알아둘 것

- CPython 내부 구조는 마이너 버전마다 바뀌므로 `cp314` wheel은 3.15에서 못 쓴다.
- 현재 인터프리터가 받아들이는 태그 목록: `python -m pip debug --verbose` 또는 `python -c "from packaging.tags import sys_tags; print(*list(sys_tags())[:5])"`.
