---
title: "venv"
date: 2026-10-19T07:06:45+09:00
draft: false
tags: ["python"]
summary: "Python 가상환경. 패키지는 따로 두지만 인터프리터는 원본을 링크로 빌려 쓴다."
altnames: ["virtualenv", "가상환경", "python venv"]
---

Python 프로젝트마다 패키지를 따로 설치하기 위한 디렉토리. `python -m venv <dir>`로 만든다.

## 무엇인가

- `bin/python`은 대개 **원본 인터프리터를 가리키는 심볼릭 링크**다 (macOS·Linux 기본값).
- `pyvenv.cfg`의 `home`에 원본 인터프리터 위치가 적혀 있다.
- `site-packages`만 venv 안에 따로 있다. 바이너리 확장 모듈은 그 Python 버전 전용으로 빌드되어 있다.

## 알아둘 것

- 원본 인터프리터가 지워지거나 다른 버전으로 바뀌면 venv는 쓸 수 없다. 고치는 방법은 없고 다시 만들어야 한다.
- `bin/pip` 같은 스크립트의 shebang에는 venv를 **만든 당시의 절대 경로**가 박힌다.
  디렉토리를 옮기면 `bad interpreter`가 난다. `python -m pip`로 우회한다.
- 패키지 관리자가 인터프리터를 업그레이드하는 환경(Homebrew 등)에서는 버전을 고정한 인터프리터로 만든다.
