---
title: "Cloudflare Error 1034"
date: 2026-10-05T12:13:34+09:00
draft: false
tags: ["cloudflare", "네트워크"]
summary: "zone이 허용하지 않는 엣지 IP로 요청이 들어왔을 때 Cloudflare가 돌려주는 오류."
altnames: ["error 1034", "Edge IP Restricted"]
---

요청을 받은 Cloudflare 엣지 IP가 해당 도메인(zone)에 할당된 IP가 아닐 때 돌려주는 오류.
공식 명칭은 *Edge IP Restricted*.

## 무엇인가

Cloudflare 엣지는 [[anycast]] 로 전 세계 같은 IP를 광고하지만, zone마다 응답할 IP 집합이 정해져 있다.
`Host`/SNI가 가리키는 zone과 접속한 IP가 맞지 않으면 원 서버로 가지 않고 엣지에서 바로 거절한다.

응답 모양이 특징적이다.

- HTTP 403
- 본문 `error code: 1034` (17바이트), HTML 오류 페이지 없음

## 알아둘 것

- DNS가 준 IP가 아니어도 zone이 허용하는 대역이면 정상 응답한다. 반대로 Cloudflare IP라고 다 되지는 않는다.
- 봇 차단·WAF 403과 헷갈리기 쉽다. 본문이 `error code: 1034` 면 헤더·쿠키 문제가 아니다.
