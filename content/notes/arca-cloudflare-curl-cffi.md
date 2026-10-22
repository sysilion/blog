---
title: "arca.live 의 Cloudflare 403 은 curl_cffi 로 TLS 지문만 바꾸면 통과한다"
date: 2026-10-21T16:07:14+09:00
draft: false
tags: ["크롤링", "cloudflare", "python"]
summary: "curl·requests 는 'Just a moment...' 403, curl_cffi impersonate=chrome 은 200. 데이터센터 IP 프록시를 거쳐도 같다."
---

## 무슨 일이

아카라이브 채널 공지의 리딤코드 모음 글을 수집 소스로 붙이려 했다. `curl` 과 `requests` 는 UA를 크롬으로 맞춰도
Cloudflare 챌린지 페이지(`Just a moment...`)와 함께 403을 받았다.
Scrapling 을 써보라는 말에 그 `Fetcher` 를 돌려 보니 200이 나왔다.

## 원인

Scrapling 의 `Fetcher` 는 브라우저를 띄우지 않는다. 안에서 [[curl-cffi|curl_cffi]] 로 크롬의 TLS 핸드셰이크를 흉내 낼 뿐이다.
이 채널은 JS 챌린지까지 가기 전에 [[tls-fingerprinting]] 단계에서 걸러내고 있었다. 헤더는 상관없었다.

## 재현

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
curl -s -A "$UA" -o /dev/null -w '%{http_code}\n' https://arca.live/b/genshin       # 403

pip install curl_cffi
python -c "from curl_cffi import requests as r; print(r.get('https://arca.live/b/genshin', impersonate='chrome').status_code)"   # 200
```

SOCKS5 프록시(Fly.io 데이터센터 IP)를 거쳐도 `curl_cffi` 는 200이었다. IP 평판보다 TLS 지문이 먼저 걸린다.

## 그래서

Scrapling 전체(`scrapling[fetchers]`)는 브라우저 의존성을 함께 끌고 오니 쓰지 않고, `curl_cffi` 하나만 의존성에 넣었다.

## 한 줄

Cloudflare 403이 헤더로 안 풀리면 브라우저를 띄우기 전에 TLS 지문부터 바꿔 본다.
