---
title: "macOS APFS에서 rm claude.md 가 CLAUDE.md 를 지운다"
date: 2026-08-27T14:00:00+09:00
draft: false
tags: ["macos", "apfs", "filesystem", "삽질"]
summary: "APFS 기본 볼륨은 대소문자를 구분하지 않는다. 소문자로 지웠는데 대문자 파일이 사라진다."
aliases: ["/wiki/macos-apfs-case-insensitive/"]
---

## 무슨 일이

`claude.md` 를 만들었다가 표준 명칭인 `CLAUDE.md` 로 다시 쓰고, 예전 파일을 정리한다고 `rm claude.md` 를 실행했다.
방금 만든 `CLAUDE.md` 가 같이 사라졌다. 정확히는 **같이** 사라진 게 아니라, 애초에 같은 파일이었다.

## 원인

macOS 기본 볼륨은 **[[apfs]] (case-insensitive, case-preserving)** 다.

- *preserving* — 이름은 `CLAUDE.md` 로 그대로 보존된다.
- *insensitive* — 조회할 때는 `claude.md` 와 `CLAUDE.md` 가 같은 항목이다.

즉 `write CLAUDE.md` 는 새 파일을 만든 게 아니라 기존 `claude.md` 를 **덮어쓰면서 이름만 바꾼 것**이고,
`rm claude.md` 는 그 하나뿐인 파일을 지웠다.

## 재현

```bash
$ diskutil info / | grep "File System Personality"
   File System Personality:  APFS

$ mkdir casetest && cd casetest
$ printf 'A' > CASE.md
$ ls
CASE.md
$ rm -f case.md      # 소문자로 지운다
$ ls -A | wc -l
       0             # 대문자 파일이 사라졌다
```

## 그래서

- **파일명 대소문자만 바꾸는 리네임은 macOS에서 no-op이 되거나 원본을 날린다.**
  `git mv -f claude.md CLAUDE.md` 처럼 명시적으로 하거나, 임시 이름을 경유한다.
  ```bash
  mv claude.md tmp.md && mv tmp.md CLAUDE.md
  ```
- Git은 기본이 [[case-sensitivity|대소문자 구분]]이라 macOS와 어긋난다. `git config core.ignorecase` 가 macOS에서 `true` 로 잡히는 이유.
- CI는 대개 Linux(ext4, case-sensitive)라서 **로컬에서 되던 import가 CI에서만 깨진다.**
  `import './Button'` vs 실제 파일 `button.tsx` — macOS는 통과, CI는 실패.
- 정말 구분이 필요하면 APFS 대소문자 구분 볼륨을 따로 만들어 거기서 작업한다.

## 한 줄

> macOS에서 `rm` 은 내가 친 이름이 아니라 **그 이름으로 찾아지는 파일**을 지운다.
