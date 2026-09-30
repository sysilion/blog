---
title: "axios 인터셉터"
date: 2026-09-30T22:31:40+09:00
draft: false
tags: ["axios", "http", "web"]
summary: "axios 요청·응답을 보내기 전/받은 뒤에 가로채는 훅. 토큰 주입과 401 갱신 재시도가 단골 용도다."
altnames: ["axios interceptor", "interceptor", "인터셉터"]
---

axios 인스턴스에 등록해 **모든 요청을 보내기 전, 모든 응답을 받은 뒤** 한 번씩 끼어드는 함수.

## 무엇인가

```ts
api.interceptors.request.use(config => config, error => Promise.reject(error));
api.interceptors.response.use(response => response, error => Promise.reject(error));
```

- **요청 인터셉터** — `config` 를 받아 고쳐서 돌려준다. `Authorization` 헤더 주입이 대표적이다.
  `async` 도 되므로 여기서 토큰을 미리 갱신하고 보낼 수도 있다.
- **응답 인터셉터** — 성공/실패 핸들러 두 개. 실패 쪽에서 `error.config` 로 원래 요청을 꺼내
  다시 보낼 수 있다(`api(error.config)`). 401 을 받으면 갱신 후 재시도하는 패턴이 여기서 나온다.

## 401 갱신 재시도 패턴

[[refresh-token|갱신 토큰]] 이 있는 앱은 보통 이렇게 짠다.

1. 401 → `_retry` 표식이 없으면 갱신을 시작한다.
2. 갱신 중(`isRefreshing`)에 들어온 다른 401 은 큐에 넣고, 갱신이 끝나면 새 토큰으로 한꺼번에 재시도한다.
3. 갱신 실패 → 큐를 전부 reject 하고 로그아웃한다.

## 알아둘 것

- **어떤 401 을 갱신 대상에서 뺄지** 먼저 정한다. 로그인·갱신·로그아웃 요청 자체의 401 은
  만료가 아니라 그 요청의 실패다. 빼지 않으면 로그인 실패가 갱신 흐름으로 들어간다.
- 큐를 쓰는 single-flight 플래그는 **모든 탈출 경로에서 꺼져야** 한다. `finally` 바깥에서
  return 하는 분기 하나가 이후의 모든 401 을 영원히 pending 으로 만든다.
- 인터셉터에서 던진 reject 는 호출한 쪽(react-query 의 `mutate` 등)까지 그대로 전파된다.
  pending 이 안 풀리면 UI 의 로딩 상태도 안 풀린다.
