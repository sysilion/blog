---
title: "CHZZK VOD 채팅에는 후원(10) 말고도 구독·구독선물·시스템 메시지가 섞여 온다"
date: 2026-10-20T17:19:46+09:00
draft: false
tags: ["chzzk", "api", "chicle"]
summary: "messageTypeCode 11=구독, 12=구독 선물, 30=시스템. 10 하나만 후원으로 세면 구독 매출은 빠지고 시스템 문구는 채팅으로 섞인다."
---

## 무슨 일이

chicle은 VOD 채팅에서 `messageTypeCode == 10` 만 후원으로 세고 나머지는 전부 일반 채팅으로 취급했다.
분석해 둔 VOD 3개(원본 채팅 72,466건)의 코드 분포를 뽑아보니 1과 10 말고도 세 가지가 더 있었다.

| 코드 | 의미 | `extras` 주요 키 | 건수 |
| --- | --- | --- | --- |
| 10 | 치즈 후원. `donationType` 이 `CHAT`·`VIDEO`·`MISSION` | `payAmount`, `donationType` | 327 |
| 11 | 구독 알림 | `month`, `tierName`, `tierNo` | 13 |
| 12 | 구독권 선물 | `giftType: SUBSCRIPTION_GIFT`, `quantity`, `giftTierName` | 2 |
| 30 | 시스템 메시지 ("이모티콘 모드 OFF") | `description`, `styleType` | 1 |

- `VIDEO` 후원의 `content` 에는 후원 문구 대신 영상 제목이 들어 있다.
- `MISSION` 후원은 `status: PENDING`, `success: false` 상태로도 `payAmount` 가 찍힌다. 미션에 실패하면 환불될 수 있는 돈이다.
- 11·12 에는 금액 필드가 없다. 12는 `content` 가 빈 문자열이다.

## 원인

[[chzzk]] 채팅 API는 [[undocumented-api|비공개 API]]라 코드표가 없다. 처음 실측할 때는 1과 10만 보였다.

## 재현

```bash
curl -s -A Mozilla/5.0 "https://api.chzzk.naver.com/service/v1/videos/14725452/chats?playerMessageTime=207000" \
 | python3 -c "import json,sys
for c in json.load(sys.stdin)['content']['videoChats']:
    if c['messageTypeCode']!=1: print(c['messageTypeCode'], c['playerMessageTime'], c['content'])"
# 30 207656 이모티콘 모드 OFF
# 10 216560 안녕하세요 탬하 ...
```

## 그래서

- 30은 사람이 친 채팅이 아니니 반응 집계에서 빼야 한다.
- 구독(11·12)은 금액을 알 수 없다. 후원 합계에 넣지 말고 건수만 따로 센다.
- 대기실 채팅(음수 시각)은 세 VOD 모두 0건이었다. 시작 전 후원이 버려지는 문제는 적어도 이 표본에서는 없다.

## 한 줄

비공개 API의 코드값으로 분류할 때는 먼저 전체 데이터의 코드 분포를 뽑아 보고, 모르는 코드는 하나씩 실제 메시지를 열어 확인한다.
