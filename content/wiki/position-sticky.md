---
title: "position: sticky"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["CSS", "레이아웃"]
summary: "가장 가까운 스크롤 컨테이너를 기준으로 붙는 배치. 기준이 바뀌면 조용히 죽는다."
altnames: ["sticky"]
---

`position: sticky` 는 요소를 평소에는 흐름대로 두고, 스크롤이 지정한 임계값을 넘으면
그 자리에 고정하는 배치 방식이다.

## 기준은 가장 가까운 스크롤 컨테이너

sticky의 기준(containing block이 아니라 **스크롤 기준**)은 **가장 가까운 조상
[[scroll-container|스크롤 컨테이너]]** 다. 그래서 중간에 스크롤 컨테이너가 하나 끼어들면
기준이 바뀌어 sticky가 아무 일도 하지 않는다. [[overflow]] 값 하나로 이 일이 벌어진다.

에러도 경고도 없이 그냥 안 붙는다는 게 이 문제의 성질이다.

## 알아둘 것

- **flex item을 sticky로 쓸 때는 `min-width: 0` 이 함께 필요하다.** 기본값 `auto` 는
  `white-space: nowrap` 텍스트를 줄이지 않으므로, 텍스트가 부모보다 넓어지면 움직일 여유가 0이 된다.
- `::before` / `::after` 를 `inset: 0` 절대 배치로 쓰면 그 의사요소는 sticky가 될 수 없다.
