---
title: "치지직 다시보기 시각은 방송 시작보다 정확히 4초 늦게 0이 된다"
date: 2026-10-23T23:58:00+09:00
draft: false
tags: ["chzzk", "chicle"]
summary: "VOD 채팅의 messageTime − playerMessageTime은 openDate + 4초로 일정했다. 라이브 채팅 시각에서 이 값을 빼면 다시보기 시각과 맞는다."
---

## 무슨 일이

chicle에 라이브 채팅 분석을 붙이면서, 라이브로 받은 채팅 시각을 나중에 올라오는 다시보기 시각과
맞출 방법이 필요했다. 방송 하나를 라이브와 VOD 양쪽으로 받아 비교할 생각이었는데, VOD 채팅에
이미 두 시각이 같이 들어 있었다. [[playermessagetime|playerMessageTime]](영상 안 위치)과
messageTime(실제 시각, epoch ms)이다.

## 원인

다시보기 영상의 0초가 방송 시작 시각(`liveOpenDate`)이 아니라 그 4초 뒤였다.
VOD 4개(1시간 45분에서 10시간 47분)를 처음·25%·50%·75%·끝 다섯 지점에서 재 보니
`messageTime − playerMessageTime − liveOpenDate` 가 모두 4.0초였다. 긴 방송에서도 어긋남이 쌓이지 않았다.
4초가 어디서 오는지(인코더 버퍼인지 플랫폼 처리인지)는 확인하지 못했다.

## 재현

```python
from datetime import datetime, timezone, timedelta
from app.chzzk_client import ChzzkClient   # chicle/backend

c = ChzzkClient()
KST = timezone(timedelta(hours=9))
meta = c.get_video_meta("15768785")
open_s = datetime.strptime(meta["live_open_date"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=KST).timestamp()
for frac in (0.02, 0.5, 0.97):
    pt = int(meta["duration"] * frac) * 1000
    chat = c._get_json(f"{c.base_url}/service/v1/videos/15768785/chats",
                       params={"playerMessageTime": pt})["content"]["videoChats"][0]
    print((chat["messageTime"] - chat["playerMessageTime"]) / 1000 - open_s)   # 4.0
```

## 그래서

라이브 채팅(WebSocket `msgTime`)을 받는 순간 `msgTime − openDate − 4000ms` 로 바꿔 저장한다.
라이브 결과의 1:23:45가 다시보기의 1:23:45와 같은 장면이 되고, 라이브로만 얻을 수 있는 동시 시청자 수를
다시보기 분석에 그대로 겹칠 수 있다. 두 기록은 라이브의 `openDate` 와 다시보기의 `liveOpenDate` 로 잇는다.
같은 방송(7시간 9분)을 라이브로 받고 다시보기를 분석해 보니 두 값이 `2026-10-23 17:55:50` 으로 같았고,
라이브로 모은 시청자 수의 마지막 표본이 VOD 길이(25,748초)의 1초 뒤에 찍혀 끝까지 어긋나지 않았다.

방송이 중간에 끊겼다 다시 켜진 VOD도 아직 재 보지 않았다.

## 한 줄

라이브와 VOD 시각을 맞출 일이 생기면 따로 녹화해 비교하지 말고, VOD 채팅 한 건의 두 시각 차이부터 본다. 재연결이 있었던 방송이면 그 VOD에서 다시 잰다.
