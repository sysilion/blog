---
title: "Recharts"
date: 2026-10-26T15:12:14+09:00
draft: false
tags: ["react", "chart"]
summary: "React 컴포넌트로 SVG 차트를 조립하는 라이브러리. 여러 계열이 데이터 배열 하나를 함께 쓴다."
altnames: ["recharts"]
---

Recharts는 `<LineChart>`, `<Area>`, `<Tooltip>` 같은 React 컴포넌트를 조합해 SVG 차트를 그리는 라이브러리다.

## 구조

- 차트 컴포넌트(`ComposedChart` 등)가 `data` 배열 하나를 받는다. 각 계열(`Line`, `Area`, `Bar`)은 `dataKey` 로 원소의 어느 필드를 그릴지 고른다.
- 한 원소가 x축의 한 점이다. 계열마다 x값을 따로 갖지 않는다.
- `Tooltip` 은 마우스에 가장 가까운 원소 하나를 골라 그 원소의 값들을 `payload` 로 넘긴다.
- `connectNulls` 를 켜면 값이 빠진 원소를 건너뛰고 선을 잇는다.

## 알아둘 것

- 간격이 다른 시계열을 합치면 원소마다 일부 필드만 차 있게 된다. 선은 `connectNulls` 로 멀쩡해 보여도 툴팁에는 그 원소에 있는 값만 나온다.
- 축을 둘 쓰려면 `YAxis` 에 `yAxisId` 를 주고 계열에서 같은 id를 가리킨다.
