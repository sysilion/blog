---
title: "대소문자 구분"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["filesystem", "git"]
summary: "파일 시스템·Git·언어별로 기준이 다르다. 로컬에서 되던 게 CI에서만 깨지는 대표 원인."
altnames: ["case sensitivity", "case-insensitive", "case-preserving"]
---

같은 이름을 대문자·소문자 차이로 다른 것으로 볼지에 대한 규칙. 계층마다 답이 다르다.

## 계층별 기준

| 계층 | 기본값 |
| --- | --- |
| [[apfs]] (macOS 기본 볼륨) | 구분하지 않음 (보존만) |
| ext4 (대부분의 Linux·CI) | 구분함 |
| NTFS | 구분하지 않음 (Windows API 기준) |
| Git 객체 저장소 | 구분함 |

## 알아둘 것

세 계층이 어긋나기 때문에 **로컬 macOS에서 통과한 import가 Linux CI에서만 깨진다.**
`import './Button'` 인데 실제 파일이 `button.tsx` 인 경우가 전형이다.

Git은 이 불일치를 `core.ignorecase` 로 흡수한다. macOS에서 `git init` 하면 자동으로 `true` 가 된다.

```bash
$ git config core.ignorecase
true
```

`bash` 의 `[[ -f x ]]` 처럼 대괄호가 겹치는 코드가 본문에 있어도 위키링크로 오해되지 않는다.
