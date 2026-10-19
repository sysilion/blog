---
title: "Homebrew가 Python을 올리면 기존 venv가 조용히 죽는다"
date: 2026-10-19T07:06:45+09:00
draft: false
tags: ["python", "macos", "homebrew"]
summary: "venv/bin/python은 복사본이 아니라 심볼릭 링크다. 원본 버전이 지워지면 링크가 끊긴다."
---

## 무슨 일이

몇 달 만에 테스트를 돌렸더니 실행 파일이 없다고 한다. 파일은 분명히 있다.

```text
$ ./venv/bin/python -m unittest
zsh: no such file or directory: ./venv/bin/python
$ ls venv/bin/python
venv/bin/python
```

## 원인

[[venv]]의 `python`은 **심볼릭 링크**다. 링크 끝을 따라가 보면 사라진 버전이 나온다.

```bash
ls -la venv/bin/python*
# python     -> python3.14
# python3.14 -> /opt/homebrew/opt/python@3.14/bin/python3.14
cat venv/pyvenv.cfg          # home = /opt/homebrew/opt/python@3.14/bin
ls /opt/homebrew/opt/ | grep python   # python@3.15 만 있고 3.14는 없다
```

Homebrew가 `python@3.14`를 `python@3.15`로 올리면서 3.14를 지웠다. `ls`는 링크 자체가
있으니 파일을 보여주지만, 실행하면 끊긴 링크를 따라가다 실패한다. 오류 메시지는 링크가
아니라 **링크를 시작한 파일**의 이름을 대서 원인이 감춰진다.

## 그래서

venv는 고칠 수 없고 다시 만들어야 한다. 버전을 고정해 두면 Homebrew 업그레이드와 무관해진다.

```bash
uv venv -p 3.13 venv && uv pip install -p venv/bin/python -r requirements.txt
```

## 한 줄

> "있는데 없다"고 하면 심볼릭 링크의 끝을 따라가 본다.
