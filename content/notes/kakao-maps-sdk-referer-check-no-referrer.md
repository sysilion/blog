---
title: "카카오맵 SDK 는 Referer 로 도메인을 검사한다. no-referrer 메타 한 줄이면 로컬에서도 뜬다"
date: 2026-11-02T16:51:12+09:00
draft: false
tags: ["kakao", "javascript", "http"]
summary: "등록 안 된 localhost 포트에서 sdk.js 가 401 로 떨어져 빈 화면만 남았다. Referer 를 안 보내면 200 이다."
---

## 무슨 일이

redtable_point 의 `index.html` 을 `python -m http.server 8765` 로 띄웠더니 지도가 없는 빈 화면만 보였다.
콘솔에는 `ReferenceError: kakao is not defined` 하나뿐이다. 배포된 사이트(bizu.is-a.dev)는 멀쩡하다.

## 원인

카카오 개발자 콘솔의 "Web 플랫폼 사이트 도메인" 에 없는 출처에서 SDK 를 받으면 `dapi.kakao.com` 이 401 을 준다.
스크립트가 아예 내려오지 않으니 `kakao` 전역이 없고, 뒤따르는 인라인 스크립트가 첫 줄에서 죽는다.

검사 기준은 요청의 [[referer]] 헤더다. 헤더가 없으면 통과시킨다.

## 재현

```bash
KEY=608c740734f775a41a0b360ae3c5f32b
URL="https://dapi.kakao.com/v2/maps/sdk.js?appkey=$KEY&libraries=services,clusterer&autoload=false"
for ref in http://localhost:8765/ http://localhost:8000/ https://bizu.is-a.dev/; do
  printf "%s -> " "$ref"; curl -s -o /dev/null -w "%{http_code}\n" -H "Referer: $ref" "$URL"
done
printf "no referer -> "; curl -s -o /dev/null -w "%{http_code}\n" "$URL"
```

```
http://localhost:8765/ -> 401
http://localhost:8000/ -> 200      # 콘솔에 등록된 포트
https://bizu.is-a.dev/ -> 200
no referer -> 200
```

## 그래서

등록된 8000 번 포트는 다른 프로젝트의 uvicorn 이 쓰고 있어서 쓸 수 없었다.
대신 테스트 하네스가 `index.html` 을 fetch 로 받아 `<head>` 바로 뒤에 두 줄을 끼워 넣고 iframe 에 `document.write` 했다.

```html
<meta name="referrer" content="no-referrer">
<base href="/app/">
```

브라우저가 SDK 요청에 Referer 를 붙이지 않으니 어떤 포트에서든 지도가 뜬다.
`base` 는 about:blank iframe 의 상대 경로(`data/map_data.json`)가 부모 주소 기준으로 풀리는 것을 바로잡는다.

배포본에는 넣지 않았다. 도메인 검사를 끄는 셈이라 키가 아무 데서나 쓰인다.

같이 고친 것: SDK 가 안 내려왔을 때 빈 화면 대신 안내 토스트를 띄우도록 `typeof kakao === 'undefined'` 가드를 넣었다.

## 한 줄

카카오맵이 로컬에서 빈 화면이면 콘솔보다 먼저 `curl -H "Referer: ..."` 로 sdk.js 상태 코드를 본다.
등록 포트를 못 쓰면 테스트용 문서에만 `no-referrer` 메타를 끼운다.
