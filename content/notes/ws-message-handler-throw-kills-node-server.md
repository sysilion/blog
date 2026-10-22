---
title: "ws 메시지 핸들러에서 던진 예외 하나가 Node 서버 전체를 죽인다"
date: 2026-10-18T19:33:51+09:00
draft: false
tags: ["nodejs", "websocket", "보안"]
summary: "JSON 한 줄({links:[null]})로 봉화 트래커가 즉사했다. 리스너 예외는 잡아 주는 곳이 없다."
---

## 무슨 일이

봉화(P2P 스트리밍) 트래커에 아래 메시지 하나를 보내자 서버 프로세스가 내려갔다.
접속해 있던 모든 시청자·방송자가 함께 끊긴다.

```json
{"type":"report","links":[null]}
```

## 원인

`msg.links.map((l) => ({ id: String(l.id) }))` 에서 `l` 이 `null` 이라 `TypeError`.
`ws.on('message', ...)` 리스너 안에서 던진 예외는 `EventEmitter.emit` 을 타고 올라가
아무도 잡지 않으면 [[uncaught-exception]] 이 되고, Node는 기본값으로 프로세스를 끝낸다.
`JSON.parse('null')` 도 유효한 JSON이라 `msg.type` 접근만으로 같은 일이 난다.

같은 서버에서 `x-chunk-hash` 헤더에 클라이언트가 보낸 해시를 그대로 넣던 곳도 있었다.
개행이 섞이면 `res.writeHead` 가 `ERR_INVALID_CHAR` 로 던지는데, async 핸들러라
unhandled rejection 으로 역시 프로세스가 죽는다.

## 재현

```bash
cd ~/proj/streaming && git stash   # 수정 전 상태
PORT=18112 node server/index.js &
node -e "import('ws').then(({default:W})=>{const ws=new W('ws://localhost:18112');
ws.on('open',()=>{ws.send(JSON.stringify({type:'hello',role:'viewer'}));
ws.send(JSON.stringify({type:'report',links:[null]}));
setTimeout(()=>fetch('http://localhost:18112/stats').then(r=>console.log('alive',r.status))
.catch(e=>console.log('DEAD',e.cause?.code)).finally(()=>process.exit()),500)})})"
# → DEAD ECONNREFUSED
git stash pop
```

## 그래서

- 파싱 직후 `msg` 가 평범한 객체인지부터 본다 (`!msg || typeof msg !== 'object'`).
- 배열 원소도 객체인지 거른 뒤 필드를 읽는다.
- 헤더로 나갈 값은 정규식으로 문자 집합을 묶는다.

## 한 줄

Node WebSocket 리스너에서는 들어온 메시지의 모양부터 검증하고 필드를 읽는다. 거기서 던진 예외는 연결 하나로 끝나지 않고 서버 프로세스를 내린다.
