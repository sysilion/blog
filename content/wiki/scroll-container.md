---
title: "스크롤 컨테이너"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["CSS", "레이아웃"]
summary: "스크롤 가능한 영역을 만드는 요소. 스크롤바가 보이지 않아도 스크롤 컨테이너일 수 있다."
altnames: ["scroll container", "scrolling box", "스크롤 컨테이너"]
---

**스크롤 컨테이너**는 내용이 넘칠 때 스크롤로 접근하게 하는 영역이다.
[[overflow]] 계산값이 `visible` 도 `clip` 도 아니면 그 요소는 스크롤 컨테이너가 된다.

## 알아둘 것

**스크롤바가 보이지 않아도 스크롤 컨테이너다.** `overflow: hidden` 은 스크롤 UI만 감춘
스크롤 컨테이너이고, 스크립트로 `scrollLeft` / `scrollTop` 을 바꾸면 실제로 스크롤된다.

이 구분이 [[position-sticky]] 의 기준을 정한다. 의도치 않게 만들어진 스크롤 컨테이너가
자손 sticky의 기준을 가로채면 sticky가 조용히 무력화된다.
