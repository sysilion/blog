---
title: "vite preview는 config의 server.https를 그대로 물려받는다"
date: 2026-09-04T22:45:00+09:00
draft: false
tags: ["vite", "pwa", "service-worker"]
summary: "dev용 self-signed 인증서를 켜 두면 preview도 HTTPS로 뜨고, 서비스워커 검증이 인증서 경고에 막힌다"
---

## 무슨 일이

PWA 서비스워커를 빌드 산출물에서 확인하려고 `npx vite preview` 를 띄웠는데,
`curl http://localhost:4173/...` 가 전부 exit code 52 (empty reply) 로 떨어졌다.

## 원인

`vite.config.ts` 의 `server.https` 는 dev 서버 전용이 아니다.
`preview` 에 별도 설정이 없으면 preview 서버가 `server` 블록을 상속한다.
아래 설정이면 preview도 `https://localhost:4173` 으로 뜬다.

```ts
export default defineConfig({
  server: {
    https: { key: fs.readFileSync('./key.pem'), cert: fs.readFileSync('./cert.pem') },
  },
})
```

## 재현

```bash
npx vite preview | grep Local          # ➜ Local: https://localhost:4173/
curl -s  http://localhost:4173/        # exit 52
curl -sk https://localhost:4173/       # 200
```

## 그래서

self-signed 인증서라 Chrome이 인증서 경고를 띄우고, 그 상태에서는
`navigator.serviceWorker.register()` 가 등록되지 않아 PWA 검증이 불가능하다.
localhost는 HTTP여도 secure context로 취급되므로, 검증은 `dist` 를 별도 HTTP 서버로 띄우는 게 빠르다.
이때 `.webmanifest` 는 파이썬 `mimetypes` 에 없어서 `application/octet-stream` 으로 나가므로
`mimetypes.add_type("application/manifest+json", ".webmanifest")` 를 먼저 등록해야 한다.

## 한 줄

`server.https` 를 켜 두면 `vite preview` 도 HTTPS다 — 서비스워커를 확인할 땐 별도 HTTP 서버로 `dist` 를 띄운다.
