---
title: "역링크 계산이 같은 페이지를 23,277번 훑고 있었다"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["hugo", "performance"]
summary: "용어 문서마다 전체 페이지의 위키링크를 다시 추출했다. partial 을 partialCached 로 바꾸자 빌드 1.4s → 0.55s."
---

## 무슨 일이

`hugo --templateMetrics` 에서 `wiki/targets.html` 이 23,277번 호출되고 누적 26.85초를 쓰고 있었다.

## 원인

`layouts/_partials/wiki/backlinks.html` 은 용어 문서 하나를 그릴 때마다 사이트의 모든 페이지에 대해
`partial "wiki/targets.html" $p` 로 그 페이지의 `[[...]]` 링크 목록을 원문에서 다시 뽑았다.
용어 112개 × 페이지 205개 ≈ 2만 3천 번. 결과는 페이지마다 항상 같은데도 매번 정규식을 돌렸다.

## 재현

```bash
hugo -d /tmp/m --templateMetrics --templateMetricsHints | grep -E 'targets|backlinks|single'
```

## 그래서

`partial` 을 [[partialcached]] 로 바꾸고 키를 페이지 경로로 줬다.

```go-html-template
{{ $targets := partialCached "wiki/targets.html" $p $p.Path }}
```

| | 전 | 후 |
| --- | --- | --- |
| targets.html 실제 실행 | 23,277회 · 26.85s | 207회 · 0.30s |
| `hugo --quiet` 실시간 | 1.15–1.43s | 0.51–0.57s |

생성된 HTML은 CSS 해시를 빼면 바이트 단위로 같다. `hugo server` 에서 노트에 링크를 추가하면 증분 빌드 뒤 역링크에 바로 반영되는 것도 확인했다.

## 한 줄

> 페이지 × 페이지 루프 안의 partial 은 결과가 페이지에만 달려 있으면 partialCached 로 한 번만 돌린다.
