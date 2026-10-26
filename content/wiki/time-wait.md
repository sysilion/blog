---
title: "TIME_WAIT"
date: 2026-10-26T09:49:34+09:00
draft: false
tags: ["tcp", "network"]
summary: "TCP 연결을 먼저 닫은 쪽이 늦게 도착할 패킷을 기다리며 2×MSL 동안 머무는 상태."
altnames: ["time wait", "TIME-WAIT"]
---

TIME_WAIT는 TCP 연결을 먼저 닫은(active close) 쪽 소켓이 마지막 ACK를 보낸 뒤 머무는 상태다.

## 구조

- 유지 시간은 2×MSL(Maximum Segment Lifetime)이다. macOS는 `net.inet.tcp.msl` 기본값이 15000ms라서 30초다.
- 이 시간 동안 같은 4-튜플(로컬 주소·포트, 원격 주소·포트)을 다시 쓰지 못하게 막는다.
  늦게 도착한 이전 연결의 패킷이 새 연결에 섞이지 않게 하려는 장치다.
- 소켓을 연 프로세스가 끝나도 커널이 들고 있다. `lsof` 에는 안 보이고 `netstat` 에만 보인다.

## 알아둘 것

- 클라이언트 쪽 TIME_WAIT는 [[ephemeral-port|임시 포트]]를 하나씩 붙잡는다. 짧은 연결을 초당 수백 개 만들면 포트가 모자랄 수 있다.
- 서버 쪽(서비스 포트) TIME_WAIT는 포트를 소모하지 않는다. 같은 포트를 여러 원격 주소가 나눠 쓴다.
- macOS는 가동 시간이 2^32 ms(약 49.7일)를 넘기면 TIME_WAIT가 만료되지 않을 수 있다.
  이 상태에서 재부팅 말고 치우는 방법은 찾지 못했다.
