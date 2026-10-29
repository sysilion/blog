---
title: "유튜브 라이브 채팅의 다시보기 시각은 메시지 시각에서 방송 시작을 빼면 나온다"
date: 2026-10-27T01:15:08+09:00
draft: false
tags: ["youtube", "yt-dlp", "chicle"]
summary: "다시보기 11,997건에서 timestampUsec − release_timestamp와 videoOffsetTimeMsec의 차이가 −0.1~+0.24초였다."
---

## 무슨 일이

chicle에서 방송 중인 유튜브 라이브의 채팅을 받게 했다. 채팅 시각을 다시보기 시각에 맞춰야 나중에 다시보기 분석과 겹쳐 볼 수 있다. [[yt-dlp]]가 방송 중에 적는 줄에도 `videoOffsetTimeMsec` 이 있지만, 이 값은 다시보기 시각이 아니다.

## 원인

방송 중에는 yt-dlp가 이 값을 "받기 시작한 때부터 몇 ms"로 채운다. 줄 모양도 다르다. 값이 `replayChatItemAction` 안이 아니라 바깥에 있고, `isLive: true` 가 붙는다. 대신 메시지마다 들어 있는 `timestampUsec` 와 영상 정보의 `release_timestamp`(실제 방송 시작)로 계산하면 다시보기 시각과 맞는다.

## 재현

끝난 방송의 채팅 다시보기로 두 값을 비교했다.

```python
start = 1790408945 * 1000          # yt-dlp info["release_timestamp"]
for line in open("hqQ5-vgX00M.live_chat.json"):
    rep = json.loads(line)["replayChatItemAction"]
    off = int(rep["videoOffsetTimeMsec"])
    for a in rep["actions"]:
        body = next(iter(a["addChatItemAction"]["item"].values()))
        diff = int(body["timestampUsec"]) // 1000 - start - off
# 11,997건: 중앙값 91ms, 최소 −100ms, 최대 239ms
```

## 그래서

방송 중에 받은 채팅은 `timestampUsec / 1000 − release_timestamp × 1000` 을 영상 시각으로 쓴다. 라이브 채팅에 붙으면 최근 몇 분 치가 다시 오므로 메시지 `id` 로 겹침을 거르고, 서버를 다시 켜서 이어 받을 때는 이미 저장한 마지막 시각 이전 메시지를 버린다. 이 처리가 없을 때는 이어 받은 뒤 143건 중 54건이 겹쳤다.

## 한 줄

라이브 채팅 시각은 받는 도구가 붙인 오프셋을 믿지 말고, 메시지 자체의 시각과 방송 시작 시각으로 다시 계산해 다시보기와 대조해 본다.
