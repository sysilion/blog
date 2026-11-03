---
title: "재연결 루프 안에서 디바운스를 걸면 끊김 배너가 영영 뜨지 않는다"
date: 2026-11-03T17:30:52+09:00
draft: false
tags: ["javascript", "websocket", "chzzk-chat"]
summary: "WebSocket onclose 가 재연결 실패마다 다시 불려 4초 타이머가 계속 처음부터 시작됐다."
---

## 무슨 일이

chzzk-chat 관리 패널에 "서버와 연결이 끊겼습니다" 배너를 붙였다. 잠깐 끊겼다 바로 붙는 경우엔 안 띄우려고
`onclose` 에서 4초 뒤에 보여 주도록 했다. 서버를 내려 보니 상태 점만 빨개지고 배너는 끝내 뜨지 않았다.

## 원인

재연결은 `onclose` 에서 3초 뒤 `connectWS()` 를 다시 부르는 방식이다. 서버가 없으면 새 연결도 곧바로 실패해
`onclose` 가 3초마다 다시 불린다. 처음 코드는 거기서 타이머를 지우고 새로 걸었다.

```js
ws.onclose = () => {
  clearTimeout(offlineTimer);
  offlineTimer = setTimeout(showBanner, 4000); // 3초마다 리셋된다
  setTimeout(connectWS, 3000);
};
```

[[debounce|디바운스]]는 "이벤트가 멈춘 뒤 N초"를 재는데, 재연결 주기(3초)가 대기 시간(4초)보다 짧으니
이벤트가 멈추는 순간이 오지 않았다.

## 재현

`internal/overlay/static/admin.html` 를 위 코드로 되돌리고 Mock 모드로 띄운 뒤 패널을 열고 프로세스를 죽인다.

```bash
cd chzzk-chat && go build -o /tmp/app ./cmd/app && /tmp/app -config config.json &
# 브라우저에서 /admin.html 을 연 다음
pkill -f "config.json"
```

10초를 기다려도 배너가 없다. 대기 시간을 3초 미만으로 줄이면 뜬다.

## 그래서

첫 끊김부터 재도록 바꿨다. 타이머가 이미 있으면 새로 걸지 않고, `onopen` 에서만 지운다.

```js
if (!offlineTimer) offlineTimer = setTimeout(showBanner, 4000);
```

## 한 줄

반복해서 불리는 콜백에 지연 표시를 걸 때는 "마지막 호출부터"인지 "첫 호출부터"인지 먼저 정하고, 재시도 주기와 대기 시간을 나란히 적어 본다.
