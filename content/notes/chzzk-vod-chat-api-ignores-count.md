---
title: "비공개 API는 count 파라미터를 무시한다 — CHZZK VOD 채팅"
date: 2026-08-27T16:10:00+09:00
draft: false
tags: ["chzzk", "api", "리버스엔지니어링"]
summary: "count=500을 보내도 200건이 온다. 파라미터가 아니라 응답을 믿어야 한다."
aliases: ["/wiki/chzzk-vod-chat-api-ignores-count/"]
---

## 무슨 일이

[[chzzk]] VOD 채팅 수집 API에 `count`를 넉넉히 넣어 요청 수를 줄이려 했다. 안 줄었다.

```text
GET /service/v1/videos/{videoNo}/chats?count={size}&playerMessageTime={cursor}
```

`count`를 얼마로 주든 **항상 200건**이 온다.

## 원인

문서화되지 않은 [[undocumented-api|내부 API]]다. 서버가 파라미터를 받기만 하고 쓰지 않는다. 클라이언트(웹 플레이어)가
늘 같은 값을 보내니 서버 쪽에서 유효성을 지킬 이유가 없었을 것이다.

## 그래서

진행률 추정용으로 **관측된 값을 상수로 박아**뒀다.

```python
# API가 count를 무시하고 실제로 반환하는 배치 크기 (진행률 추정용)
OBSERVED_BATCH_SIZE = 200
```

같은 API에 함정이 두 개 더 있다.

- `playerMessageTime`(ms) 커서로 ASC 순회하고 `nextPlayerMessageTime`이 null이면 끝인데,
  **커서 경계의 채팅이 다음 페이지에 다시 포함된다.** 중복 제거가 필수다.
- **음수 시간**이 나온다. 방송 시작 전 대기실 채팅이다. 필터링하지 않으면 타임라인이 앞으로 튄다.

## 한 줄

> 비공개 API에서는 요청 파라미터가 계약이 아니다. 계약은 **실제 응답**이다.

관련: [CHZZK 채팅 비공식 프로토콜 뜯어보기]({{< relref "/posts/chzzk-chat-protocol" >}})
