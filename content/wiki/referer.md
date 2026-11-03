---
title: "Referer"
date: 2026-11-02T16:51:12+09:00
draft: false
tags: ["http", "web"]
summary: "요청을 일으킨 페이지의 주소를 담는 HTTP 요청 헤더. 철자 오타가 표준이 됐다."
altnames: ["Referrer", "HTTP Referer", "referrer-policy", "no-referrer"]
---

브라우저가 요청을 보낼 때 "이 요청이 어느 페이지에서 비롯됐는가" 를 담아 보내는 HTTP 요청 헤더.

## 무엇인가

```
GET /v2/maps/sdk.js?appkey=... HTTP/1.1
Host: dapi.kakao.com
Referer: https://bizu.is-a.dev/redtable_point/
```

- 철자는 `Referer` 다. 1996 년 RFC 1945 초안의 오타가 그대로 굳었다. 반면 이를 제어하는 정책 이름은 바르게 `Referrer-Policy` 다.
- 링크 클릭, 이미지·스크립트 로드, fetch 등 페이지가 일으키는 거의 모든 하위 요청에 붙는다.
- 무엇을 얼마나 보낼지는 `Referrer-Policy` 가 정한다. 응답 헤더, `<meta name="referrer">`, 요소별 `referrerpolicy` 속성 어디서나 지정할 수 있다.

| 값 | 보내는 것 |
| --- | --- |
| `no-referrer` | 아무것도 보내지 않는다 |
| `origin` | 스킴 + 호스트 + 포트만 |
| `strict-origin-when-cross-origin` | 같은 출처면 전체 URL, 다른 출처면 origin 만. 브라우저 기본값 |
| `unsafe-url` | 항상 전체 URL |

## 알아둘 것

- 클라이언트가 마음대로 정하는 값이라 인증 수단이 될 수 없다. 그런데도 지도 SDK·광고 스크립트·일부 API 가 허용 도메인 검사에 이 헤더를 쓴다. 헤더를 비우거나 바꾸면 검사를 지나친다.
- 그런 검사는 보통 "헤더 없음" 을 허용한다. 주소창 직접 입력이나 HTTPS→HTTP 전환처럼 정상적으로 헤더가 빠지는 경우가 많기 때문이다.
- `<meta name="referrer" content="no-referrer">` 를 문서에 넣으면 그 문서가 일으키는 모든 요청에서 헤더가 빠진다. 로컬 테스트에 유용하고, 배포본에 넣으면 도메인 검사를 스스로 끄는 셈이 된다.
