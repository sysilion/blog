---
title: "자기 신고 지표는 남의 증언으로 나눠라"
date: 2026-08-27T17:00:00+09:00
draft: false
tags: ["p2p", "보안", "설계"]
summary: "sentBytes를 크게 적으면 1등이 된다. 받은 쪽의 recv를 증언으로 쓰면 단독 위조는 막힌다."
aliases: ["/wiki/self-reported-metrics-need-attestation/"]
---

## 무슨 일이

[[p2p|P2P]] 스트리밍에서 기여도 순위를 매기는데, 기여도의 원천이 **보낸 쪽의 자기 신고**(`sentBytes`)였다.
크게 적으면 최우선 upstream이 된다. 점수 체계 전체가 무의미해진다.

## 그래서

받은 쪽이 신고한 `links[].recv`를 **[[attestation|증언(attestation)]]** 으로 쓰고, 자기 신고를 증언 비율만큼만
인정한다.

```js
const credibility = Math.min(1, attestedBytes / Math.max(p.report.sentBytes, 1));
const sentRate = p.rates.sent * credibility;
```

정직한 peer는 두 값이 일치해 `credibility = 1`. 부풀린 만큼 정확히 깎인다.

## 남는 구멍과 두 번째 방어선

증언 방식은 **서로 밀어주는 [[sybil-attack|공모(sybil)]]** 를 막지 못한다. 그래서 같은 IP에 몰린 peer에
**제곱 감점**을 건다 (GossipSub v1.1의 P6).

```js
const surplus = Math.max(0, colocated - 2);   // 가정용 NAT 2대까지는 무료
return 0.25 * surplus * surplus;
```

선형이면 정상 사용자와 공격자를 함께 때린다. 제곱이면 2~3대는 사실상 무료지만 10 peer 농장은
만점을 통째로 상쇄한다.

세 번째 디테일: **리포트를 아예 안 보내는 회피 경로**도 막아야 한다. 무보고 기본 점수를 그대로
주면 sybil이 침묵으로 감점을 피한다. 동거 감점은 리포트 유무와 무관하게 건다.

## 설계 원칙

증언이 사라지거나 링크가 끊기면 점수가 **낮아지는 방향**으로 실패하게 한다. 실패가 공격자에게
이득이면 그건 방어가 아니다.

## 한 줄

> 교차 검증할 수 없는 지표는 지표가 아니라 **신고서**다.

관련: [봉화 — 시청자가 릴레이가 되는 P2P 라이브 스트리밍]({{< relref "/posts/bonghwa-p2p-live-streaming" >}})
