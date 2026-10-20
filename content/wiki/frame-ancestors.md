---
title: "frame-ancestors"
date: 2026-10-20T01:35:44+09:00
draft: false
tags: ["web", "security"]
summary: "어떤 출처가 이 페이지를 iframe으로 넣을 수 있는지 정하는 CSP 지시어."
altnames: ["CSP frame-ancestors", "X-Frame-Options"]
---

Content-Security-Policy의 지시어. 이 문서를 `<iframe>`·`<frame>`·`<object>`로 품을 수 있는 부모 출처를 정한다.

## 무엇인가

```text
Content-Security-Policy: frame-ancestors 'self' https://*.example.com
```

- `'none'`이면 어디서도 품을 수 없다. `'self'`는 같은 출처만 허용한다.
- 예전 헤더 `X-Frame-Options: DENY | SAMEORIGIN`을 대신한다. 둘 다 있으면 브라우저는 `frame-ancestors`를 따른다.
- 응답 헤더로만 동작한다. `<meta http-equiv>`로 넣은 것은 무시된다.

## 알아둘 것

- 막힌 iframe은 부모 페이지에서 오류로 잡히지 않는다. `onerror`가 오지 않고 빈 화면(또는 브라우저의 거부 화면)만 남는다.
- 반대로 이 헤더가 없다고 임베드가 되는 것도 아니다. 그 주소에 페이지가 없으면 200 응답의 오류 화면이 iframe 안에 뜬다.
