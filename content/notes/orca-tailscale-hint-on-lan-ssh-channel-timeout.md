---
title: "Orca의 Tailscale 안내는 LAN 서버에서 SSH 채널이 막혀도 붙는다"
date: 2026-10-23T16:52:56+09:00
draft: false
tags: ["orca", "ssh", "network"]
summary: "같은 공유기 아래 서버인데 'Tailscale로 연결하라'는 오류가 떴다. 문구는 오류 종류만 보고 붙고, 실제 원인은 30초 SSH 채널 타임아웃이었다."
---

## 무슨 일이

[[orca-managed-server|Orca 관리 서버]] `MACSTUDIO`(192.168.1.132, 같은 LAN)에 새 터미널을 열 때 이런 오류가 자주 떴다.

```
Could not connect to the remote Orca runtime. If the server is on another network,
connect both devices to Tailscale and pair using its Tailscale address ...
Error invoking remote method 'runtimeEnvironments:getOrcadStatus':
SshChannelOpenTimeoutError: SSH exec channel timed out
```

## 원인

Tailscale 문장은 렌더러가 붙이는 고정 안내문이다. 메시지 앞부분이 "could not connect" 계열이면
주소가 tailnet(100.x, `*.ts.net`)인지만 보고 두 가지 안내 중 하나를 덧붙인다.
LAN 주소면 "다른 네트워크라면 Tailscale을 써라" 쪽이 붙는다.

실제 오류는 뒤쪽의 `SshChannelOpenTimeoutError` 다. `getOrcadStatus` 는 이미 맺어 둔 SSH 연결 위에
exec [[ssh-channel|채널]]을 하나 열고, 30초(`dk=3e4`) 안에 열리지 않으면 실패한다.
그날 잰 바로는 네트워크와 서버 sshd 모두 멀쩡했다.

- ping 0.8ms, 새 SSH 연결 0.17초, 양쪽 유선 1Gbps에 NIC 에러 0.
- 서버는 절전 이력이 없고 sshd 설정은 기본값.
- OpenSSH ControlMaster 연결 하나로 2초마다 exec 채널을 150번 열었더니 전부 0.5초 안에 열렸다.
- 그런데 Orca의 SSH 연결은 16:32, 16:37, 16:39에 클라이언트 쪽에서 닫고 다시 붙었다.
  16:39:15에 Orca trace에 `remote_terminal_stream_stall_recovery`(14초 무응답)가 먼저 찍혔다.

사흘 뒤 원인이 나왔다. 서버가 가동 49.7일을 넘겨 [[time-wait|TIME_WAIT]]가 만료되지 않았고,
[[ephemeral-port|임시 포트]]가 차 가는 중이었다. 자세한 내용은
[macOS는 가동 49.7일이 지나면 TIME_WAIT를 치우지 않는다](/blog/notes/macos-49-days-uptime-time-wait-never-expires/)에 적었다.

## 재현

문구가 붙는 조건은 앱 번들에서 바로 보인다.

```bash
cd /Applications/Orca.app/Contents/Resources
grep -aoE ".{250}connect both devices to Tailscale.{120}" app.asar | head -1
grep -aoE "SSH exec channel timed out.{0,80}" app.asar | head -1
grep -aoE "(dk|Tgt|Egt)=[0-9e.]+" app.asar | sort -u   # dk=3e4 → 30초
```

서버가 채널을 늦게 여는지는 Orca 바깥에서 따로 잰다.

```bash
C=~/.ssh/cmp.sock   # 스크래치 경로는 소켓 길이 제한(104바이트)에 걸린다
ssh -fN -o ControlMaster=yes -o ControlPath=$C user@host
for i in $(seq 1 150); do /usr/bin/time -p ssh -o ControlPath=$C user@host true; sleep 2; done
ssh -o ControlPath=$C -O exit user@host
```

## 그래서

LAN 서버에서 Tailscale 안내가 뜨면 오류 끝의 예외 이름을 먼저 본다. 그다음 서버 안에서
`curl -sv http://127.0.0.1:6768/` 로 `orcad` 에 붙는지, `uptime` 이 49일을 넘겼는지 확인한다.
Orca 연결이 얼마나 자주 다시 붙는지는 서버의 `log show --predicate 'process CONTAINS "sshd"'` 로 본다.

## 한 줄

Orca 오류에 Tailscale 안내가 붙으면 그 문장은 건너뛰고 맨 끝 예외 이름(`SshChannelOpenTimeoutError` 등)부터 본다.
