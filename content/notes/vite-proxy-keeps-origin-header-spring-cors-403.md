---
title: "Vite 프록시를 거쳐도 Origin 헤더는 남는다 — LAN 주소에서만 403"
date: 2026-10-01T00:20:01+09:00
draft: false
tags: ["vite", "cors", "spring-security", "삽질"]
summary: "localhost에선 되고 Tailscale IP로 열면 모든 API가 403 'Invalid CORS request'. 프록시는 Host만 바꾸고 Origin은 그대로 넘겨서 백엔드 CORS가 걸러냈다."
---

## 무슨 일이

DealSignal 프론트를 `https://100.121.83.8:3000` (Tailscale IP)로 열면 로그인이 안 됐다.
콘솔에는 이것뿐이다.

```
POST https://100.121.83.8:3000/api/v1/auth/login 403 (Forbidden)
```

`https://localhost:3000` 에서는 같은 계정으로 잘 된다. curl 로 Tailscale 주소를 때려도 200 이 나온다.
그래서 한참을 프론트 코드에서 찾았다.

## 원인

curl 은 `Origin` 헤더를 안 보낸다. 브라우저는 보낸다. 헤더 하나 붙이니 바로 재현됐다.

```bash
curl -sk -X POST https://100.121.83.8:3000/api/v1/auth/login \
  -H 'Origin: https://100.121.83.8:3000' -H 'Content-Type: application/json' \
  -d '{"email":"x@example.com","password":"x"}'
# Invalid CORS request        ← 403
```

[[vite|Vite]] 개발 서버의 `server.proxy` 는 `/api` 를 `https://localhost:8443` 으로 넘긴다.
`changeOrigin: true` 는 이름과 달리 **Host 헤더만** 대상에 맞춰 바꾼다. `Origin` 은 브라우저가
붙인 그대로 백엔드까지 간다.

백엔드(Spring Security)는 `Origin` 이 있으면 [[cors|CORS]] 검사를 한다. 허용 목록은
`localhost:3000`, `127.0.0.1:3000` 뿐이다. 얼마 전 `"*"` 에서 좁힌 것이다. Tailscale IP 는 없으니
`CorsFilter` 가 컨트롤러에 닿기도 전에 403 을 돌려준다. 로그인만이 아니라 **모든 API** 가 그렇다.

정리하면 —

| 접속 주소 | 브라우저가 보낸 Origin | 백엔드 판단 |
| --- | --- | --- |
| `localhost:3000` | `https://localhost:3000` | 허용 목록에 있음 → 통과 |
| `100.121.83.8:3000` | `https://100.121.83.8:3000` | 목록에 없음 → **403** |
| curl | (없음) | CORS 검사 자체를 안 함 → 통과 |

## 그래서

브라우저 입장에서 이 요청은 **같은 출처**다(개발 서버에 보내고, 개발 서버가 대신 받아온다).
그 사실을 백엔드에도 그대로 전하면 된다. 프록시에서 `Origin` 을 떼어냈다.

```ts
// vite.config.ts
proxy: {
  '/api': {
    target: 'https://localhost:8443',
    changeOrigin: true,
    secure: false,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
    },
  },
},
```

백엔드 허용 목록에 IP 를 추가하는 방법도 있지만, 그러면 IP 가 바뀔 때마다 백엔드를 재시작해야
한다. 프록시 경로는 애초에 교차 출처가 아니므로 프록시가 지우는 쪽이 맞다.

## 한 줄

`changeOrigin` 은 Host 를 바꾸지 Origin 을 바꾸지 않는다. "curl 로는 되는데 브라우저에선 안 된다" 면 먼저 `Origin` 을 붙여 보자.
