---
title: "Cloudflare 엣지 IP는 아무거나 골라 써도 되는 게 아니었다"
date: 2026-10-05T12:13:34+09:00
draft: false
tags: ["cloudflare", "네트워크"]
summary: "--resolve로 엣지 IP를 고정하면 IP에 따라 정상 응답, error 1034, 연결 실패가 갈린다."
---

## 무슨 일이

Cloudflare 뒤에 있는 사이트를 `curl --resolve` 로 특정 엣지 IP에 고정해 요청했다.
"Cloudflare는 [[anycast]] 라서 어느 엣지 IP든 같은 사이트를 준다"고 생각했는데,
IP마다 결과가 달랐다. 어떤 IP는 200, 어떤 IP는 `error code: 1034` (HTTP 403, 본문 17바이트).

## 원인

엣지 IP가 전부 모든 zone을 받아주지는 않는다. zone마다 응답하는 IP 대역이 정해져 있고,
그 밖의 엣지 IP로 들어온 요청은 [[cloudflare-error-1034]] 로 거절된다.
DNS가 돌려준 IP가 아니어도 같은 대역(예: `104.16.0.0/13` 안쪽)이면 받아주는 경우가 있었다.

## 재현

```bash
D=<cloudflare 뒤의 도메인>
for ip in 104.16.0.1 104.18.0.1 162.159.0.1 104.16.132.229; do
  printf "%s " $ip
  curl -s -m 8 --resolve $D:443:$ip -o /dev/null -w "%{http_code} %{size_download}\n" https://$D/
done
# 104.16.0.1     200 144853
# 104.18.0.1     200 144853
# 162.159.0.1    403 17      ← 본문: error code: 1034
# 104.16.132.229 403 17
```

## 그래서

엣지 IP를 고정할 때는 "Cloudflare IP면 된다"가 아니라 **그 zone이 받아주는 IP인지** 먼저 본다.
403 + 17바이트 본문이면 차단이 아니라 IP-zone 불일치다. 헤더나 [[user-agent]] 를 만져도 안 바뀐다.

**한 줄:** 1034는 "너 말고 다른 엣지로 와" — 요청이 아니라 IP를 바꿔야 한다.
