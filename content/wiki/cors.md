---
title: "CORS"
date: 2026-10-01T00:20:01+09:00
draft: false
tags: ["web", "http", "security"]
summary: "브라우저가 다른 출처로 보내는 요청을 서버가 명시적으로 허용해야만 응답을 읽게 하는 규약. Origin 헤더가 트리거다."
altnames: ["Cross-Origin Resource Sharing", "교차 출처 리소스 공유"]
---

브라우저가 **다른 출처(origin)** 의 리소스를 스크립트로 읽으려 할 때, 서버가 그 출처를 허용한다고
응답 헤더로 밝혀야만 읽게 해 주는 규약.

## 무엇인가

- **출처** = 스킴 + 호스트 + 포트. `https://localhost:3000` 과 `https://127.0.0.1:3000` 은 다른 출처다.
- 브라우저는 스크립트가 보내는 요청에 `Origin` 헤더를 붙인다. 서버는 이걸 보고
  `Access-Control-Allow-Origin` 으로 답한다. 안 맞으면 브라우저가 응답을 버린다.
- 단순하지 않은 요청(JSON 본문, 커스텀 헤더 등)은 먼저 `OPTIONS` **프리플라이트** 를 보낸다.

## 알아둘 것

- **`Origin` 헤더가 없으면 CORS 는 일어나지 않는다.** curl, 서버 간 호출, 같은 출처 내비게이션은
  헤더가 없다. "curl 은 되는데 브라우저는 안 된다" 의 단골 원인이다.
- 브라우저의 동일 출처 정책은 **응답 읽기** 를 막을 뿐 요청 전송은 막지 않는다. 하지만 Spring
  Security 의 `CorsFilter` 처럼 서버가 허용 목록 밖의 `Origin` 을 보면 **요청 자체를 403 으로 거절** 하는
  구현도 있다. 그러면 콘솔에 CORS 오류가 아니라 그냥 403 이 찍힌다.
- 개발 서버 프록시([[vite|Vite]] `server.proxy` 등)를 지나는 요청은 브라우저에겐 같은 출처지만,
  `Origin` 헤더는 프록시를 통과해 백엔드까지 간다. `changeOrigin` 옵션은 Host 만 바꾼다.
- `allowCredentials: true` 와 `"*"` 는 같이 못 쓴다. 쿠키·Authorization 을 쓰려면 출처를 명시해야 한다.
