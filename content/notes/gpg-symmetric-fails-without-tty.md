---
title: "Claude Code의 ! 명령으로는 gpg 대칭 암호화 passphrase를 입력할 수 없다"
date: 2026-10-19T05:53:00+09:00
draft: false
tags: ["gpg", "claude-code", "shell"]
summary: "TTY가 없으면 pinentry가 뜨지 못해 gpg --symmetric이 Operation cancelled로 끝난다."
---

## 무슨 일이

비밀정보 백업을 암호화하는 `seal.sh`(`gpg --symmetric`)를 Claude Code 프롬프트에서 `!`로 실행하자 바로 실패했다.

```text
gpg: problem with the agent: Inappropriate ioctl for device
gpg: error creating passphrase: Operation cancelled
tar: Write error
```

## 원인

gpg는 passphrase를 직접 묻지 않고 gpg-agent를 거쳐 [[pinentry]]에게 맡긴다. 이 Mac에는 `pinentry-tty`·`pinentry-curses`만 있고 GUI용 `pinentry-mac`이 없다.
`!`로 실행한 명령에는 터미널(TTY)이 붙지 않아서 pinentry가 입력창을 띄울 곳이 없다.
`tar: Write error`는 gpg가 먼저 죽어 파이프가 끊긴 결과일 뿐이다.

## 재현

```bash
# TTY가 없는 셸(Claude Code의 ! 명령이나 Bash 도구, CI)에서 실행
echo hi | gpg --symmetric -o /tmp/x.gpg   # Inappropriate ioctl for device, exit 2
```

## 그래서

- passphrase를 받는 명령은 별도 터미널 창에서 실행한다.
- 스크립트에는 `export GPG_TTY="$(tty)"`를 넣는다. 일반 터미널에서도 curses pinentry가 터미널을 찾지 못하는 경우를 막는다.
- 한 번 입력한 passphrase는 gpg-agent에 캐시되므로, 그 뒤에는 TTY가 없어도 `--pinentry-mode error`로 복호화 검증을 할 수 있다.

**한 줄:** gpg passphrase 입력은 pinentry 몫이고, pinentry는 TTY 없이는 뜨지 못한다.
