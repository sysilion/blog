---
title: "WebCrypto"
date: 2026-09-10T16:20:00+09:00
draft: false
tags: ["web", "crypto", "javascript"]
summary: "브라우저 내장 암호 API. crypto.subtle 로 접근하고 보안 컨텍스트에서만 동작한다."
altnames: ["Web Crypto API", "crypto.subtle", "SubtleCrypto"]
---

브라우저가 네이티브로 제공하는 암호 API. 라이브러리를 받지 않고 해시·서명·암복호화·키 유도를 한다.

## 무엇인가

- `crypto.getRandomValues()` — 난수. 동기 함수다.
- `crypto.subtle` — 나머지 전부. **모두 Promise 를 반환한다.**
  `importKey` · `deriveKey` · `encrypt` · `decrypt` · `sign` · `verify` · `digest`.

```js
const key = await crypto.subtle.importKey('raw', bytes, 'PBKDF2', false, ['deriveKey']);
const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertext);
```

입출력이 전부 `ArrayBuffer` / `TypedArray` 다. 문자열은 `TextEncoder` / `TextDecoder` 로 오간다.

## 알아둘 것

- **[[secure-context]] 에서만 존재한다.** `https` 와 `localhost` 는 되고, 평문 `http` 나
  LAN IP(`192.168.x.x`) 로 열면 `crypto.subtle` 이 `undefined` 다. 기능 탐지를 해두는 게 좋다.
- 이름이 "subtle" 인 건 경고다. 잘못 쓰기 쉬운 저수준 API 라는 뜻으로 붙었다.
- 키에 `extractable: false` 를 주면 JS 로 원본 바이트를 꺼낼 수 없다. 기본적으로 꺼두는 게 낫다.
- 지원하는 [[pbkdf2]] 는 있지만 Argon2 는 없다. AES-CBC·CTR·[[aes-gcm]], RSA, ECDSA, HKDF 등을 지원한다.
- 브라우저에서 도는 이상 **페이지를 내려주는 서버를 신뢰한다는 전제**가 깔린다. 스크립트가 바뀌면 끝이다.
