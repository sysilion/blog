---
title: "APFS"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["macos", "filesystem"]
summary: "macOS 기본 파일 시스템. 기본 볼륨은 대소문자를 구분하지 않는다."
altnames: ["Apple File System"]
---

**APFS**(Apple File System)는 macOS 10.13 High Sierra 이후 macOS의 기본 파일 시스템이다.

## 알아둘 것

macOS 설치 시 만들어지는 기본 볼륨은 **case-insensitive, case-preserving** 이다.
[[case-sensitivity|대소문자 구분]] 문서 참고 — 이름은 입력한 대로 보존하지만, 조회할 때는
`CLAUDE.md` 와 `claude.md` 가 같은 항목이다.

```bash
$ diskutil info / | grep "File System Personality"
   File System Personality:  APFS
```

대소문자를 구분하는 볼륨(`APFS (Case-sensitive)`)은 디스크 유틸리티에서 따로 만들 수 있다.
