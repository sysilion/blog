---
title: "이마트 카드·포인트 할인은 표시가에 이미 반영돼 있다"
date: 2026-09-04T22:50:00+09:00
draft: false
tags: ["dealsignal", "이마트", "데이터"]
summary: "discountedPrice 는 카드할인·포인트할인이 빠진 뒤의 값이다. 할인 금액을 '추가로 더 빠지는 돈'으로 보여주면 안 된다."
aliases: ["/wiki/emart-card-point-discount-already-in-price/"]
---

## 무슨 일이

DealSignal 할인 모아보기를 만들면서 카드할인 금액을 카드에 `-208,600원`으로 표시했다.
그런데 그 상품의 표시가는 49,400원. 할인액이 판매가보다 네 배 크다.

## 원인

이마트 상품 API의 `price.discountedPrice` 는 프로모션이 **이미 적용된** 값이다.
`promotion[].enuriAmt` 는 그 적용에 쓰인 금액이지, 표시가에서 더 뺄 돈이 아니다.

```
원가(sellPrice)   258,000
카드할인(enuriAmt) 208,600
표시가(discountedPrice) 49,400   ← 258,000 - 208,600
```

즉 표시가는 "조건을 만족해야 받는 가격"이다. 행사카드로 전액 결제하지 않으면 258,000원을 낸다.
포인트할인도 같다 — 신세계포인트를 적립해야 그 가격이다.

## 재현

전체 데이터에서 `discountedPrice = sellPrice - enuriAmt` 가 성립하는 비율을 세보면 명확하다.

```sql
WITH ls AS (
  SELECT DISTINCT ON (product_id) id, product_id
  FROM price_snapshots ORDER BY product_id, captured_at DESC
)
SELECT pi.tag, count(*) n,
       count(*) FILTER (WHERE s.discounted_price = s.sell_price - pi.discount_amount) deducted
FROM ls
JOIN promotion_infos pi ON pi.snapshot_id = ls.id
JOIN price_snapshots s  ON s.id = ls.id
WHERE pi.tag IN ('카드할인','신세계포인트할인')
GROUP BY pi.tag;
```

```
       tag        |  n   | deducted
------------------+------+----------
 카드할인         |  705 |      627
 신세계포인트할인 | 1339 |     1210
```

나머지(카드 78, 포인트 129)는 여러 프로모션이 겹쳐 딱 떨어지지 않는 경우다.

## 그래서

UI에서 할인액을 `-N원`으로 쓰지 않는다. 대신 표시가가 조건부임을 밝힌다.

- 뱃지: `카드가` / `포인트가`
- 가격 아래: `행사카드 전액 결제 시` / `신세계포인트 적립 시`
- 조건 미충족 시 실제 가격은 `originalPrice` 취소선으로 이미 보인다

곁가지로 하나 더 — 이 구조 때문에 `discountedPrice` 는 행사 시작·종료마다 출렁인다.
"판매가 자체가 내려간 것"(재고정리·유통기한 임박)을 찾으려면 `discountedPrice` 가 아니라
`sellPrice` 의 90일 고점 대비 하락을 따로 계산해야 한다. 그런 상품은 끝자리가 40원으로 떨어진다
(1,940원 / 9,940원).

## 한 줄

이마트 API의 프로모션 금액은 이미 차감된 값이다. 표시가는 조건부 가격이지 확정가가 아니다.
