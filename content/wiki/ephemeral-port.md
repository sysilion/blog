---
title: "임시 포트"
date: 2026-10-26T09:49:34+09:00
draft: false
tags: ["tcp", "network"]
summary: "포트를 지정하지 않고 나가는 연결을 열 때 커널이 골라 주는 로컬 포트 범위."
altnames: ["ephemeral port", "ephemeral port range", "dynamic port"]
---

임시 포트는 클라이언트가 `bind` 없이 `connect` 할 때 커널이 자동으로 붙여 주는 로컬 포트다.

## 구조

- macOS 범위는 `net.inet.ip.portrange.first`~`last`, 기본 49152~65535로 16,384개다.
- 리눅스는 `net.ipv4.ip_local_port_range`, 기본 32768~60999다.
- 연결이 [[time-wait|TIME_WAIT]]에 들어가도 그 포트는 상태가 끝날 때까지 묶여 있다.

## 알아둘 것

- 다 차면 `connect()` 가 `EADDRNOTAVAIL`(macOS 메시지 "Can't assign requested address")로 즉시 실패한다.
  `127.0.0.1` 로 가는 루프백 연결도 마찬가지다.
- 사용량 확인: `netstat -an -p tcp | awk 'NR>2{p=$4; sub(/.*\./,"",p); if (p+0>=49152) print p}' | sort -u | wc -l`
- 서버의 리스닝 포트가 임시 포트 범위 안에 있어도(예: 50190) 정상이다. 다만 그만큼 범위를 같이 쓴다.
