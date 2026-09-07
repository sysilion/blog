---
title: "MediaRecorder.stop()은 인코더 백로그를 버린다"
date: 2026-08-27T17:05:00+09:00
draft: false
tags: ["webrtc", "mediarecorder", "webm", "브라우저"]
summary: "chunk마다 recorder를 재시작했더니 1.5초 중 28%가 사라졌다. 실효 2.6fps."
aliases: ["/wiki/mediarecorder-stop-drops-encoder-backlog/"]
---

## 무슨 일이

라이브 스트림을 1.5초 chunk로 쪼개려고 [[mediarecorder]]를 주기적으로 `stop()` → `start()` 했다.
**영상이 사라졌다.**

2880×1368 화면 공유에서 재보니 chunk 13개 전부 마지막 프레임이 1.08초 이전에 끝났다.
녹화 창 1.5초 중 **28% 이상 손실**, 실효 프레임레이트 **2.6fps**.

## 원인

인코딩은 캡처보다 뒤처진다. `stop()`은 아직 인코딩되지 않은 프레임 백로그를 flush하지 않고
**그냥 버린다.** 해상도가 높아 인코더가 밀릴수록 손실이 커진다.

## 그래서

recorder를 멈추지 않는다. 하나만 계속 돌리고(`start(timeslice)`) **바이트 스트림을 직접 자른다.**

문제는 두 번째 이후 blob에 [[webm|WebM]] 헤더가 없어 독립 디코딩이 안 된다는 점이다. 그래서

1. 첫 blob에서 init segment(EBML 헤더)를 떼어 보관하고
2. chunk마다 앞에 붙이고
3. **keyframe으로 시작하는 cluster 경계에서만** 자른다

최소 [[webm|EBML]] 파서가 필요하다. 요소 ID는 첫 바이트의 선행 0비트 개수가 길이를 정한다.

```js
const len = first >= 0x80 ? 1 : first >= 0x40 ? 2 : first >= 0x20 ? 3 : first >= 0x10 ? 4 : 0;
```

부작용: chunk 길이가 설정값과 달라진다. 인코더가 keyframe을 드물게 넣으면 1.5초보다 길어진다.
그래서 재생 로직은 시간이 아니라 **시퀀스 번호 기준**이어야 한다.

## 한 줄

> `stop()`은 "마무리"가 아니라 "중단"이다. 연속 스트림을 자르려면 컨테이너 포맷을 직접 알아야 한다.

관련: [봉화 — 시청자가 릴레이가 되는 P2P 라이브 스트리밍]({{< relref "/posts/bonghwa-p2p-live-streaming" >}})
