---
title: "TLS 지문"
date: 2026-09-22T18:08:12+09:00
draft: false
tags: ["크롤링", "보안", "네트워크"]
summary: "TLS 핸드셰이크 모양만으로 클라이언트를 식별하는 기법. 헤더를 아무리 맞춰도 드러난다."
altnames: ["TLS fingerprinting", "JA3", "JA4", "TLS 핑거프린팅"]
---

TLS 핸드셰이크의 ClientHello가 어떤 모양인지로 클라이언트 종류를 알아내는 기법.
[[bot-detection|봇 탐지]]가 [[user-agent|User-Agent]]보다 먼저 보는 신호다.

## 무엇을 보는가

ClientHello에 담기는 값들의 **목록과 순서**가 라이브러리마다 다르다.

- 지원 암호 스위트(cipher suites) 목록과 나열 순서
- TLS 확장(extensions)의 종류와 순서
- 지원 타원곡선(supported groups), 포인트 포맷
- ALPN, 서명 알고리즘

이 값들을 정해진 규칙으로 이어 붙여 해시한 것이 **JA3**(및 후속 규격 JA4)다.
Chrome·Firefox·curl·Python `requests`(OpenSSL)·Go `crypto/tls`가 저마다 다른 해시를 낸다.

## 알아둘 것

**헤더는 애플리케이션이 정하지만 지문은 TLS 스택이 정한다.** 브라우저와 똑같은 User-Agent와
헤더 세트를 보내도, 핸드셰이크를 OpenSSL이 하면 OpenSSL로 보인다.
헤더를 다 맞췄는데 403이 나오고 같은 요청이 `curl`에서는 200이면 이 계층을 의심한다.

우회하려면 TLS 스택 자체를 바꿔야 한다 — `curl_cffi`(브라우저 지문을 흉내내는 curl-impersonate 바인딩),
`tls-client`, 또는 실제 브라우저([[playwright]] 등)로 요청한다.
[[datacenter-ip|출구 IP]]를 바꾸는 프록시는 이 차단에는 듣지 않는다. IP가 아니라 악수 모양을 보기 때문이다.
