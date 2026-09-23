---
title: "root 아닌 sshd 세션에서는 macOS nohup 이 실행조차 안 된다"
date: 2026-09-23T17:11:07+09:00
draft: false
tags: ["macos", "ssh", "nohup"]
summary: "사용자 권한으로 띄운 sshd 로 붙으면 /usr/bin/nohup 이 'can't detach from console' 을 내고 127 로 끝난다."
---

## 무슨 일이

Orca 의 SSH 원격 기능을 로컬에서 검증하려고, Docker 없이 **내 계정 권한으로 `sshd` 를 고포트에 띄우고** 그 호스트에 붙었다.
연결·인증·파일 업로드까지는 멀쩡했는데 원격 relay 만 뜨지 않았다. 로그에는 한 줄뿐이었다.

```
nohup: can't detach from console: Inappropriate ioctl for device
```

relay 는 `nohup node relay.js ... </dev/null &` 로 띄우는데, 이 [[nohup]] 이 명령을 실행하기도 전에 죽고 있었다.

## 원인

root 가 아닌 sshd 는 로그인 세션용 audit 세션을 만들지 못한다. sshd 로그에 그 흔적이 남는다.

```
BSM audit: bsm_audit_session_setup: setaudit_addr failed: Operation not permitted
```

macOS 의 `/usr/bin/nohup` 은 HUP 을 무시하는 것 외에 **콘솔 세션에서 떨어져 나오는 단계**를 거친다
(에러 문구가 그 단계에서 나온다). 이 세션에서는 그 단계가 `ENOTTY` 로 실패하고, 명령을 실행하지 않은 채 127 로 끝났다.
stdin·stdout·stderr 를 모두 리다이렉트해도 마찬가지다.

## 재현

```bash
D=$(mktemp -d) && cd "$D"
ssh-keygen -q -t ed25519 -N '' -f hostkey && ssh-keygen -q -t ed25519 -N '' -f key
cp key.pub authorized_keys
cat > cfg <<EOF
Port 22222
ListenAddress 127.0.0.1
HostKey $D/hostkey
PidFile $D/pid
AuthorizedKeysFile $D/authorized_keys
UsePAM no
StrictModes no
EOF
/usr/sbin/sshd -f "$D/cfg" -E "$D/log"   # 절대 경로여야 한다 (sshd 가 re-exec 한다)
ssh -i key -p 22222 -o StrictHostKeyChecking=no -o UserKnownHostsFile="$D/kh" 127.0.0.1 \
  '/usr/bin/nohup true </dev/null >/dev/null; echo exit=$?'
# nohup: can't detach from console: Inappropriate ioctl for device
# exit=127
grep BSM log
kill "$(cat pid)"
```

## 그래서

테스트용 호스트에서만 `PATH` 앞쪽에 HUP 만 무시하는 shim 을 두면 원격 스크립트를 고치지 않고 돌릴 수 있다.

```sh
#!/bin/sh
trap "" HUP
exec "$@"
```

실제 macOS 원격 호스트(시스템 sshd = root)에서는 이 문제가 없다. 사용자 권한 sshd 로 만든 테스트 환경에서만 생기는 문제다.

## 한 줄

**macOS `nohup` 은 audit 세션 없이는 동작하지 않는다. 사용자 권한 sshd 로 테스트하면 `nohup ... &` 로 띄우는 데몬은 전부 안 뜬다.**
