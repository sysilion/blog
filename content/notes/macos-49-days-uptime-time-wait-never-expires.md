---
title: "macOS는 가동 49.7일이 지나면 TIME_WAIT를 치우지 않는다"
date: 2026-10-26T09:49:34+09:00
draft: false
tags: ["macos", "tcp", "network"]
summary: "52일째 켜 둔 Mac Studio에서 TIME_WAIT 7만 8천 개가 만료되지 않고 쌓여 임시 포트가 바닥났다. 루프백 연결도 EADDRNOTAVAIL로 실패한다."
---

## 무슨 일이

LAN의 Mac Studio(macOS 26.3)에 Orca가 붙지 않았다. ping과 SSH 로그인은 멀쩡했다.
서버 안에서 자기 자신에게 연결하는 것부터 실패했다.

```
$ curl -sv http://127.0.0.1:6768/
* Immediate connect fail for 127.0.0.1: Can't assign requested address
```

## 원인

[[ephemeral-port|임시 포트]] 16,384개 중 16,383개가 차 있었다. 거의 전부 [[time-wait|TIME_WAIT]] 소켓이었다.

```
78231 TIME_WAIT
 2013 LAST_ACK
```

`net.inet.tcp.msl` 이 15000이라 TIME_WAIT는 30초면 사라져야 한다. 그런데 60초 사이에 만료된 소켓이 0개였다.
10분 간격으로 찍은 목적지별 개수도 한 자리까지 같았다.

부팅은 2026-09-03 10:25:51이다. 여기에 2^32 ms(49일 17시간 2분 47초)를 더하면 2026-10-23 03:28이 된다.
Orca 연결이 처음 흔들리기 시작한 게 그날(10-23) 오후다. 시각이 이렇게 맞아서, 커널의 32비트
밀리초 TCP 시계(`tcp_now`)가 한 바퀴 돌면서 TIME_WAIT 타이머가 멈춘 것으로 본다. 커널 소스로 확인하지는 않았다.
그날부터 닫힌 연결이 하나도 정리되지 않고 쌓였다. 사흘 뒤 포트가 다 찼다. 그 사이에도 Orca가 간헐적으로
`SshChannelOpenTimeoutError` 를 낸 건 포트가 차 가는 동안 SSH 터널의 새 연결이 가끔 실패했기 때문으로 보인다.

## 재현

```bash
uptime; sysctl -n kern.boottime
python3 -c "import datetime as d; print(d.datetime.fromtimestamp(BOOT_SEC)+d.timedelta(milliseconds=2**32))"

# TIME_WAIT가 줄어드는지 60초 비교
netstat -an -p tcp | awk '$6=="TIME_WAIT"{print $4,$5}' | sort > /tmp/tw1; sleep 60
netstat -an -p tcp | awk '$6=="TIME_WAIT"{print $4,$5}' | sort > /tmp/tw2
comm -23 /tmp/tw1 /tmp/tw2 | wc -l      # 0이면 만료가 멈춘 상태

# 임시 포트 사용량
netstat -an -p tcp | awk 'NR>2{p=$4; sub(/.*\./,"",p); if (p+0>=49152) print p}' | sort -u | wc -l
```

## 그래서

만료가 멈춘 TIME_WAIT를 재부팅 말고 치우는 방법은 찾지 못했다. 연결을 많이 만드는 서비스(Ollama, Docker,
IDE 원격 서버 등)가 도는 Mac이면 포트가 며칠 만에 찬다. 상시 켜 두는 Mac은 49일이 되기 전에 재부팅한다.

## 한 줄

macOS 서버에서 `Can't assign requested address` 가 보이면 `uptime` 부터 본다. 49일을 넘겼으면 재부팅 일정을 잡는다.
