---
title: "base64url"
date: 2026-09-10T15:45:00+09:00
draft: false
tags: ["encoding", "web"]
summary: "+ 와 / 를 - 와 _ 로 바꾼 base64 변형. URL·파일명·HTML 속성에 그대로 넣을 수 있다."
altnames: ["base64 url safe", "URL-safe base64", "RFC 4648 §5"]
---

표준 base64 의 62·63번 문자 `+` `/` 를 `-` `_` 로 바꾼 인코딩. RFC 4648 §5 에 규정돼 있다.

## 무엇인가

| | 62 | 63 | 패딩 |
| --- | --- | --- | --- |
| 표준 base64 | `+` | `/` | `=` |
| base64url | `-` | `_` | 보통 생략 |

알파벳이 `A-Za-z0-9-_` 뿐이라 URL 경로·쿼리스트링·파일명·HTML 속성 어디에 넣어도
추가 이스케이프가 일어나지 않는다. JWT 가 이걸 쓴다.

```js
// Node
buf.toString('base64url')
Buffer.from(s, 'base64url')

// 브라우저 — atob/btoa 는 표준 base64 만 안다. 직접 바꿔야 한다
const dec = s => atob(s.replace(/-/g, '+').replace(/_/g, '/'));
const enc = b => btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
```

## 알아둘 것

- **브라우저의 `atob`/`btoa` 는 base64url 을 모른다.** 그냥 넣으면 `InvalidCharacterError` 다.
- 패딩 `=` 를 뺀 게 관례지만 필수는 아니다. `atob` 은 패딩이 없어도 받아준다.
- HTML 속성에 바이너리를 실을 때 특히 유용하다. [[html-template]] 이 표준 base64 의 `+` 를
  `&#43;` 로 바꿔버리기 때문이다.
- 표준 base64 와 길이는 같다. 크기 이득은 없고 문자 집합만 안전해진다.
