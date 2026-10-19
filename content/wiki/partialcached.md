---
title: "partialCached"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["hugo", "go-template"]
summary: "결과를 키별로 한 번만 계산해 빌드 내내 재사용하는 Hugo partial 호출."
altnames: ["partialcached", "partial cached"]
---

`partialCached` 는 [[hugo]] 에서 partial 의 렌더 결과를 캐시하는 함수다.
`partialCached "이름" 컨텍스트 키...` 형태로 부르고, **이름 + 키 조합**이 같으면 두 번째부터는 다시 실행하지 않는다.

## 구조

- 키를 생략하면 partial 이름만으로 캐시된다 — 사이트 전체에서 결과가 하나. 페이지마다 다른 결과라면 반드시 키를 준다 (`.Path`, `.RelPermalink` 등).
- 캐시 수명은 한 번의 빌드다. `hugo server` 증분 빌드에서는 바뀐 페이지에 대해 다시 계산된다.

## 알아둘 것

- 결과가 **컨텍스트와 키에만** 달려 있을 때만 안전하다. 키에 넣지 않은 값(현재 페이지 등)을 안에서 읽으면 첫 호출의 결과가 엉뚱한 곳에 재사용된다.
- `--templateMetrics --templateMetricsHints` 가 캐시 후보를 제안해 준다.
