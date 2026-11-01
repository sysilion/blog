---
title: "lsof는 포트 번호를 서비스 이름으로 바꿔 보여준다 (8770이 dpap로 찍힌다)"
date: 2026-11-02T02:10:02+09:00
draft: false
tags: ["macos", "network", "lsof"]
summary: "lsof -i :8770 결과에 8770이 없고 dpap만 보여서, 떠 있는 서버를 꺼진 것으로 잘못 판단했다."
---

## 무슨 일이

vodcut 편집기 서버(8770 포트)가 떠 있는지 `lsof -i :8770` 으로 봤다. 출력에 `localhost:dpap (CLOSED)` 같은 줄만 있고
8770이라는 숫자는 없어서 서버가 꺼졌다고 판단했다. 실제로는 같은 포트에서 LISTEN 중이었고 `curl` 은 200을 받았다.

## 원인

[[lsof]] 는 기본으로 포트 번호를 `/etc/services` 에 적힌 서비스 이름으로 바꿔 출력한다.
8770은 Digital Photo Access Protocol(`dpap`)로 등록돼 있다. 게다가 필터 없이 `-i :8770` 만 주면
다른 프로세스가 그 포트로 맺었던 CLOSED 연결까지 함께 나와서, 정작 LISTEN 줄이 없는 결과처럼 읽힌다.

## 재현

```bash
grep -w 8770 /etc/services
# dpap            8770/tcp    # Digital Photo Access Protocol
lsof -i :8770                        # 포트 칸이 *:dpap, localhost:dpap 로 찍힌다
lsof -nP -iTCP:8770 -sTCP:LISTEN     # 숫자 그대로, 듣고 있는 소켓만
```

## 그래서

서버가 떠 있는지는 `-nP` 와 `-sTCP:LISTEN` 을 붙인 결과로 보고, `curl` 로 한 번 더 확인한다.
`-n` 은 호스트 이름 조회를, `-P` 는 포트 이름 변환을 끈다.

## 한 줄

포트 확인은 `lsof -nP -iTCP:<포트> -sTCP:LISTEN` 으로 하고, 숫자가 안 보이면 `/etc/services` 부터 의심한다.
