---
title: "로그인 401 한 번 뒤로 로그인 버튼이 영원히 도는 이유"
date: 2026-09-30T22:31:40+09:00
draft: false
tags: ["axios", "react", "auth", "삽질"]
summary: "로그인 요청의 401을 토큰 갱신 인터셉터가 가로채 isRefreshing을 켜놓고 끄지 않았다. 다음 실패는 큐에 갇혀 응답이 와도 끝나지 않는다."
---

## 무슨 일이

DealSignal에서 비밀번호를 한 번 틀리면 "로그인 실패" 토스트는 뜬다. 그런데 **두 번째부터는
버튼이 스피너로 바뀐 채 멈추고 입력란도 잠긴다.** 네트워크 탭에는 401 응답이 정상적으로
와 있다. 새로고침 전까지는 올바른 비밀번호를 넣어도 소용없다.

## 원인

[[axios-interceptor|응답 인터셉터]] 가 **모든 401** 을 "액세스 토큰 만료" 로 취급했다.
로그인 요청의 401(비밀번호 오류)도 같은 분기를 탄다.

```ts
if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
        // 갱신이 끝나면 다시 보내겠다며 큐에 넣고 기다린다
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
    }
    originalRequest._retry = true;
    isRefreshing = true;                       // ← 여기서 켜고
    const refreshToken = store.refreshToken;
    if (!refreshToken) {
        logout();
        return Promise.reject(error);          // ← 끄지 않고 나간다
    }
    try { ...refresh... } finally { isRefreshing = false; }
}
```

로그인 화면에는 [[refresh-token|갱신 토큰]] 이 없다. 그래서 첫 401은 `!refreshToken` 분기로
빠져나가는데, 그 위에서 켠 `isRefreshing` 이 `finally` 바깥이라 **true 로 남는다.**
두 번째 401은 "지금 갱신 중이니 기다려" 분기로 들어가 `failedQueue` 에 들어가고,
그 큐를 비워줄 `processQueue` 는 아무도 부르지 않는다. 프로미스가 영원히 pending 이라
react-query 의 `isPending` 도 영원히 true 다.

## 재현

```bash
# 1) 틀린 비밀번호로 두 번 POST — 백엔드는 둘 다 401 을 정상 반환한다
curl -sk -o /dev/null -w '%{http_code}\n' -X POST https://localhost:8443/api/v1/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"x@example.com","password":"wrong"}'
# 2) 브라우저 로그인 폼에서 같은 짓을 두 번 하면 두 번째는 토스트 없이 스피너만 남는다
```

## 그래서

- 인증 엔드포인트(`/auth/login`, `/auth/signup`, `/auth/refresh`, `/auth/logout`)의 401 은
  인터셉터를 **아예 타지 않게** 했다. 그 401 은 만료가 아니라 그 요청의 실패다.
- `isRefreshing = true` 는 실제로 갱신 호출에 들어가기 직전으로 옮겼다. 갱신 없이
  빠져나가는 경로가 플래그를 켜둘 수 없게.
- 요청 인터셉터도 인증 엔드포인트는 건너뛴다. 만료된 옛 토큰이 저장돼 있으면 로그인
  요청 전에 갱신을 시도하다가 "Invalid refresh token" 으로 로그인이 실패하던 것도 같이 사라진다.

## 한 줄

single-flight 플래그는 "실제로 비행에 들어가는 순간" 켜고, 인증 요청 자체의 401 은 갱신 대상이 아니다.
