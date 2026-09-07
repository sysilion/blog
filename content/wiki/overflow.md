---
title: "overflow"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["CSS", "레이아웃"]
summary: "넘치는 내용을 어떻게 다룰지. hidden 은 스크롤 컨테이너를 만들고 clip 은 만들지 않는다."
altnames: ["overflow: hidden", "overflow: clip"]
---

`overflow` 는 요소 박스를 넘치는 내용의 처리를 정한다.

| 값 | 넘친 내용 | [[scroll-container\|스크롤 컨테이너]] 생성 |
| --- | --- | --- |
| `visible` | 그대로 보임 | 안 함 |
| `hidden` | 잘림 | **함** (스크롤 UI만 감춤) |
| `clip` | 잘림 | 안 함 |
| `scroll` / `auto` | 잘림 + 스크롤 | 함 |

## 알아둘 것

**`hidden` 과 `clip` 의 차이는 눈에 보이지 않는다.** 둘 다 넘친 내용을 자르지만
`hidden` 만 스크롤 컨테이너를 만든다. 그래서 안쪽의 [[position-sticky]] 가 죽는다.
반대로 `clip` 은 프로그래밍적 스크롤조차 허용하지 않으므로, 자르기만이 목적이라면 `clip` 이 맞다.

`getComputedStyle(el).overflowX` 로 두 값을 구분할 수는 있지만,
sticky가 죽었다는 신호는 어디에도 나오지 않는다.
