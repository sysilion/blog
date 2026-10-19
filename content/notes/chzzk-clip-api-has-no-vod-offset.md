---
title: "CHZZK 클립 API는 원본 VOD의 몇 초인지 알려주지 않는다"
date: 2026-10-19T07:06:45+09:00
draft: false
tags: ["chzzk", "api", "chicle"]
summary: "목록·상세·재생정보 어디에도 오프셋이 없다. 생성 시각으로 근사하면 무작위의 2배쯤 맞는다."
---

## 무슨 일이

chicle에서 시청자 클립을 하이라이트 근거로 쓰려고 했다. 클립이 VOD의 **몇 초 지점**에서
잘렸는지만 알면 된다. 그런데 [[chzzk]]의 [[undocumented-api|비공개 API]] 세 곳 어디에도 그 값이 없다.

```bash
CH=a7e175625fdea5a7d98428302b7aa57f
curl -s -A Mozilla/5.0 "https://api.chzzk.naver.com/service/v1/channels/$CH/clips?filterType=ALL&orderType=RECENT&size=50"
curl -s -A Mozilla/5.0 "https://api.chzzk.naver.com/service/v1/clips/{clipUID}/detail"
curl -s -A Mozilla/5.0 "https://api.chzzk.naver.com/service/v1/play-info/clip/{clipUID}"
```

`videoId`는 원본 VOD가 아니라 **클립 자신의** 영상 ID다. 시간 정보는 `createdDate`뿐이다.
`detail`의 `optionalProperties`는 웹 번들이 쓰는 값(`COMMENT`, `OWNER_CHANNEL` 등)만 받고,
그 밖의 값은 `400 잘못된 값을 입력했습니다`를 돌려준다.

## 원인

클립 페이지의 "원본 영상" 링크(`/video/{no}?currentTime=...`)는 렌더된 화면에만 있다.
그래서 이걸 쓰는 다른 프로젝트는 브라우저로 페이지를 열어 링크를 긁는다.

## 그래서

라이브 중에 만든 클립은 생성 버튼을 누르기 직전 장면이다. 그래서
`[생성 − 방송 시작 − 클립 길이 − 90초, 생성 − 방송 시작]`을 "이 근처"로 잡았다.

7.4시간 방송(클립 34개)에서 검증했다. 시간창이 방송 전체의 16%를 덮는다.

| | 클립 시간창과 겹칠 확률 |
|---|---|
| 채팅으로 찾은 🔥 구간 28개 | **39%** |
| 같은 길이의 무작위 구간 5,000개 | 19% |

[[base-rate|기저율]]의 2배다. 신호는 있지만 위치를 믿을 정도는 아니다. 그래서 클립만으로는
하이라이트를 만들지 않고, 이미 찾은 구간에 **근거로만** 붙인다.

## 한 줄

> 근사치는 기저율과 비교해 보기 전까지 신호인지 우연인지 모른다.
