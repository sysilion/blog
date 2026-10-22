---
title: "ws 는 닫힌 소켓에 send 해도 예외를 던지지 않는다"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["nodejs", "websocket", "bonghwa"]
summary: "ws 8.x 에서 CLOSED 상태의 send() 는 조용히 bufferedAmount 만 늘린다. 봉화 ingest 가 tracker 재시작 뒤 업로드를 전부 흘려버렸다."
---

## 무슨 일이

봉화(`streaming/`)의 `server/ingest.js` 는 방송 중 tracker 가 재시작되면, OBS 가 다시 붙을 때까지 세그먼트 업로드를 전부 잃었다. 로그에는 아무것도 없었다.

## 원인

Node 의 `ws` 라이브러리(8.21.3)는 `readyState === CLOSED` 인 소켓에 `send()` 하면 예외를 던지지 않는다.
콜백을 넘기지 않았다면 아무 신호도 없고 `bufferedAmount` 만 늘어난다. 브라우저 [[websocket]] 도 닫힌 뒤의 send 는 버린다.
"보내다 실패하면 catch 로 잡힌다" 는 가정이 틀렸다.

## 재현

```bash
cd streaming && node -e "import('ws').then(({WebSocketServer,default:WebSocket})=>{const s=new WebSocketServer({port:0,host:'127.0.0.1'},()=>{const w=new WebSocket('ws://127.0.0.1:'+s.address().port);w.on('open',()=>{w.close();w.on('close',()=>{w.send('x');console.log('readyState',w.readyState,'buffered',w.bufferedAmount);s.close()})})})})"
# readyState 3 buffered 1
```

## 그래서

보내기 전에 `readyState !== WebSocket.OPEN` 이면 다시 접속하도록 바꿨다.

## 한 줄

> ws 로 보내기 전에 `readyState` 가 OPEN 인지 확인하고, 예외가 안 난다고 전송이 된 걸로 치지 않는다.
