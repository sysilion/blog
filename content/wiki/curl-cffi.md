---
title: "curl_cffi"
date: 2026-10-22T09:49:46+09:00
draft: false
tags: ["python", "크롤링", "네트워크"]
summary: "브라우저의 TLS·HTTP/2 지문을 흉내 내는 curl-impersonate 의 파이썬 바인딩."
altnames: ["curl-cffi", "curl-impersonate"]
---

curl-impersonate 를 cffi 로 감싼 파이썬 HTTP 클라이언트. 요청을 보낼 때 실제 브라우저와 같은 [[tls-fingerprinting|TLS 지문]]과 HTTP/2 설정을 낸다.

## 구조

curl-impersonate 는 브라우저별로 암호 스위트 순서, TLS 확장, HTTP/2 SETTINGS 프레임 값을 맞춰 둔 curl 포크다.
curl_cffi 는 이 라이브러리를 파이썬에서 부르게 해 주고, `requests` 와 거의 같은 API(`curl_cffi.requests.get`, `Session`)와 asyncio 클라이언트(`AsyncSession`)를 함께 제공한다.

흉내 낼 브라우저는 `impersonate` 인자로 고른다. `chrome`, `safari`, `firefox` 처럼 버전 없는 이름은 그 패키지 버전이 지원하는 최신 프로필로 연결되고, `chrome124`, `safari184_ios` 처럼 버전을 박을 수도 있다. 지원 목록은 `curl_cffi.requests.BrowserType` 에 있다.

## 알아둘 것

`impersonate` 를 주지 않으면 브라우저 지문이 나가지 않는다. import 만 바꾸면 차단도 그대로다.

헤더는 그대로 사용자 몫이다. 지문은 크롬인데 User-Agent 가 `python-requests` 면 그 불일치로 걸릴 수 있다. `impersonate` 를 주면 User-Agent 등 기본 헤더도 그 브라우저 것으로 채워지므로 UA 를 따로 넣지 않는 편이 낫다. 주지 않으면 User-Agent 헤더 자체가 빠진다.

TLS 지문 단계에서 막는 사이트만 통과한다. JS 챌린지(Cloudflare Turnstile 등)를 풀어야 하는 페이지는 JS 를 실행하지 못하니 [[playwright]] 같은 실제 브라우저가 필요하다.

Scrapling 의 `Fetcher` 등 여러 스크래핑 라이브러리가 내부에서 curl_cffi 를 쓴다. 브라우저 의존성이 필요 없으면 curl_cffi 만 직접 설치하는 편이 가볍다.
