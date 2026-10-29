---
title: "playerMessageTime"
date: 2026-10-23T23:58:00+09:00
draft: false
tags: ["chzzk", "api"]
summary: "치지직 VOD 채팅이 영상 안 어느 위치에서 나왔는지 나타내는 ms 값. 실제 시각인 messageTime과 짝으로 온다."
altnames: ["messageTime", "msgTime"]
---

[[chzzk|치지직]] VOD 채팅 API가 채팅마다 붙여 주는 영상 안 위치(ms).

## 무엇인가

- `GET /service/v1/videos/{videoNo}/chats` 의 `videoChats[]` 항목에 들어 있다. 같은 항목에 실제로 보낸 시각
  `messageTime`(epoch ms)도 있다.
- `playerMessageTime` 은 조회 커서로도 쓴다. 이 값을 쿼리로 넘기면 그 위치부터 채팅이 온다.
- 방송 전 대기실 채팅은 음수로 올 수 있다.
- 라이브 채팅(WebSocket)에는 영상 위치가 없고 실제 시각 `msgTime` 만 있다. 필드 이름도 다르다
  (`msg`·`msgTypeCode`·`uid` 대 VOD의 `content`·`messageTypeCode`·`userIdHash`). 값의 뜻은 같다.

## 알아둘 것

- 다시보기(REPLAY)에서는 `messageTime − playerMessageTime` 이 방송 시작 `liveOpenDate` 보다 4초 늦은 값으로 일정했다
  (2026-10 실측, VOD 4개). 라이브 `msgTime` 을 영상 위치로 바꿀 때 이 차이를 쓴다.
- 라이브 상세의 `openDate` 와 다시보기 메타의 `liveOpenDate` 는 같은 방송이면 같은 문자열이다 (KST, 초 단위.
  2026-10 실측 1건). 라이브 기록과 다시보기를 잇는 열쇠로 쓸 수 있다.
