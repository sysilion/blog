---
title: "출석체크 5곳을 조사했더니 자동화 가부는 앱 검사 위치가 갈랐다"
date: 2026-09-11T18:20:00+09:00
draft: false
tags: ["크롤링", "playwright", "자동화"]
summary: "UA 정규식 하나로 막던 곳은 뚫렸고, 서버가 플래그를 렌더하던 곳은 못 뚫었다."
---

## 무슨 일이

적립 자동화에 출석체크 사이트를 늘리려고 GS25·CU·T멤버십·이마트·11번가를 조사했다.
다섯 곳 다 "앱에서 하세요" 로 막혀 있었는데, **한 곳만 웹에서 그대로 됐다.**

## 원인

[[app-gate|앱 전용 게이트]]를 어디서 판정하느냐가 달랐다.

11번가 혜택ZIP 은 페이지 JS 안에 조건문 하나가 전부였다.

```js
isApp: () => /CP_ELEVENST/i.test(window.navigator.userAgent),
...
attendanceApply: function() {
    if (!promo.isApp()) { alert('11번가 APP에서 참여하세요.'); return; }
```

판정 근거가 [[user-agent|UA]] 문자열뿐이라, UA 에 토큰을 붙이니 출석 버튼이 정상 동작했다.

이마트(`eapp.emart.com`)는 서버가 플래그를 박아 내려줬다. `window.isApp = false;` 를
HTML 에 직접 쓰고, 퀵메뉴 데이터 API 는 웹 요청에
`죄송합니다. 이마트앱에서만 사용가능한기능입니다.` 를 돌려줬다. 변수를 덮어써도
데이터가 안 오니 소용없다. UA 후보 5종을 시도했지만 전부 false 그대로였다.

GS25(`m.woodongs.com/gs/attendance`)는 조건문조차 없었다. 라우트는 200 인데
Flutter 웹뷰 브리지가 없어 `#root` 가 `<div></div>` 로 비어 있었다. 렌더 실패로 막는 형태다.

T멤버십은 세 번째 종류였다. 앱 검사처럼 보이지만 실은 아니다 —
`isApp()` 이 `['AOS','IOS'].includes(commAppChkOSType())` 인데 저 함수는 UA 에
`Android` 만 있으면 `'AOS'` 를 돌려준다. 즉 **앱 판정이 아니라 OS 판정**이고,
평범한 모바일 브라우저에서도 true 다. 진짜로 막는 건 세션이었다.

```js
gotoLogin: function() {
    if ($common.isApp() && ENV != 'local') {
        commAppMobileFnc('JSLogin', {...});           // 브라우저엔 없는 함수
    } else {
        location.href = '/mps/app-bff/login/main.do';  // 404 (ERROR.COMMON.0006)
    }
}
```

앱이면 네이티브 브리지, 아니면 웹 로그인으로 보내는데 그 웹 경로가 죽어 있다.
코드에는 남았지만 서버에서 내려간 것이다. UA 를 어떻게 맞춰도 세션을 못 받는다.

## 재현

```bash
# 11번가 — UA 하나로 갈린다
UA='Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile Safari/537.36'
#   일반 UA: 버튼은 보이지만 클릭이 alert 로 막힌다
#   + CP_ELEVENST: 정상 동작
```

```js
// 이마트 — 정적 소스와 런타임 값이 다르다. 이게 함정이었다
// curl 로 받은 HTML:  nativeAppYn : ''      → 게이트 없어 보임
// 브라우저에서 읽으면: nativeAppYn = 'N'     → 게이트 작동
```

SSG 이벤트 페이지를 정적 소스만 보고 "빈 문자열이라 `=== 'N'` 분기를 안 탄다"고
판단했다가, Playwright 로 실제 읽어보고 뒤집혔다.

## 그래서

- 11번가는 `elevenst` 서브커맨드로 넣었다 (하루 2P, 7일 연속 20P).
- 이마트는 모듈만 만들고 `enable: false`. 게이트에 걸리면 '실패' 가 아니라
  **'앱전용'** 이라는 별도 상태로 보고하게 했다 — 뭉뚱그리면 매일 같은 알림을 보고도
  원인을 못 짚는다.
- 곁가지로, `eapp.emart.com` 은 가정용 IP 를 403 으로 막아 SOCKS5 프록시를 물려야
  200 이 온다. [[datacenter-ip|IP]] 차단과 반대 방향이라 잠깐 헤맸다.
  Chromium 은 SOCKS 인증을 지원하지 않으니 인증 없는 프록시여야 한다.

## 한 줄

앱 게이트는 **클라이언트 조건문이면 뚫리고 서버 렌더 플래그면 안 뚫린다** —
그리고 '앱 전용' 이라 보이는 것 중에는 앱 검사가 아니라 **세션 발급 경로가 앱뿐인** 경우가 섞여 있다.
