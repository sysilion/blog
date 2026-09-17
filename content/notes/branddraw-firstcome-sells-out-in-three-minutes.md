---
title: "브랜드뽑기 선착순은 14:03이면 이미 전량 마감이다 — 우선순위 설정이 닿지 않는다"
date: 2026-09-17T14:05:21+09:00
draft: false
tags: ["naverpay", "자동화", "playwright"]
summary: "오픈 3분 뒤에 들어가니 브랜드 4개가 전부 soldOut. pick 모드의 brand_priority는 한 번도 평가되지 않고 보너스 뽑기로 넘어갔다"
---

## 무슨 일이

[[브랜드뽑기]] 를 오늘은 '오늘의집' 으로 뽑으려고 `brand_priority` 에 넣고
`pick` 모드로 돌렸다. 실행은 14:03. 로그는 한 줄로 끝났다.

```
14:03:27 [INFO]   선착순 마감 — 보너스 뽑기
14:03:38 [INFO]   클릭포인트 수령 — 10원
```

리포트를 열어보니 열린 브랜드 4개가 **전부** `sold_out: true` 였다.

```json
{"id": "oliveyoung", "sold_out": true}
{"id": "ohouse",     "sold_out": true}
{"id": "kurly",      "sold_out": true}
{"id": "aladin",     "sold_out": true}
```

## 원인

선착순 물량이 3분을 못 버틴다. 2026-09-10 실측은 "14:09 이전 전량 마감" 이었는데
오늘은 **14:03 시점에 이미 0개**다. 마감이 더 빨라졌다.

`_choose_brand()` 는 `sold_out=False` 인 브랜드만 후보로 모은 뒤 우선순위를 본다.
후보가 비면 우선순위 루프는 **한 번도 돌지 않고** `None` 을 돌려주고, 코드는 곧바로
`fallback_random` (보너스 뽑기) 로 넘어간다. 즉 `brand_priority` 는 정각에 카드를
누를 수 있을 때만 의미가 있는 설정이다.

## 재현

```bash
cd ~/proj/naver
python3 -m naverpay_click branddraw --mode pick   # 14:03 실행
cat reports/branddraw_2026-09-17_14-03-41.json
```

## 그래서

- 오늘 배정된 브랜드는 '오늘의집' 이었지만 `picked_by` 는 `priority` 가 아니라
  **`random`** 이다. 우연히 원하던 브랜드가 나온 것이지 우선순위가 먹힌 게 아니다.
- 클릭포인트 10원은 선착순이든 보너스든 똑같이 나온다. 늦었다고 손해는 아니다.
- 우선순위를 진짜로 쓰려면 스케줄(13:57)대로 창을 미리 띄워두는 수밖에 없다.
  같은 Chrome 프로필을 쓰므로 수동 실행 전에 **스케줄 프로세스를 먼저 죽여야 한다.**

## 한 줄

선착순 이벤트에서 '무엇을 고를지' 설정은 '언제 누를지' 를 이기지 못한다.
