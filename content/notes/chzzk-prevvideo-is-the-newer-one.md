---
title: "CHZZK VOD 메타의 prevVideo는 이전 방송이 아니라 더 최근 방송이다"
date: 2026-10-20T01:36:29+09:00
draft: false
tags: ["chzzk", "api", "chicle"]
summary: "이름대로 '이전 방송' 버튼에 붙이면 거꾸로 간다. 공개 시각으로 판정해야 한다."
---

## 무슨 일이

chicle 결과 화면에 같은 채널의 이전/다음 방송 버튼을 달려고 [[chzzk]] VOD 메타의
`prevVideo`·`nextVideo`를 썼다. 이름대로 붙였더니 '이전 방송'이 하루 뒤 방송이었다.

## 원인

채널 영상 목록이 최신순이라, 목록에서 '앞 항목'(`prev`)이 시간상 더 새 방송이 된다.
[[undocumented-api|비공개 API]]라 이 관례를 적어둔 곳은 없다.

## 재현

```bash
curl -s -A Mozilla/5.0 https://api.chzzk.naver.com/service/v2/videos/14725452 \
  | python3 -c 'import json,sys; c=json.load(sys.stdin)["content"]
print("self", c["publishDate"])
for k in ("prevVideo","nextVideo"): print(k, c[k]["publishDate"])'
# self      2026-08-16 19:12:13
# prevVideo 2026-08-17 01:28:56   ← 더 최근
# nextVideo 2026-08-16 02:01:06
```

덤으로, 라이브 다시보기의 `publishDate`는 다시보기 공개 시각이라 `liveOpenDate`(방송 시작)보다
몇 시간 늦다. "방송일"로 쓰려면 `liveOpenDate` 쪽이다.

## 그래서

이름을 믿지 않고 `publishDate`를 비교해 `newer`/`older`로 나눈다. 시각이 없을 때만
prev=최근 관례로 떨어진다. `chicle/backend/app/vod_info.py`, 회귀 테스트는 `tests/test_vod_info.py`.

## 한 줄

비공개 API 필드 이름의 방향(prev/next, start/publish)은 값으로 확인하고 쓴다.
