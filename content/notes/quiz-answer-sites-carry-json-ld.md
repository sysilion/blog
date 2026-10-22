---
title: "앱테크 정답 사이트는 정답을 JSON-LD 에 넣어 두어서, 화면을 긁지 않고 읽힌다"
date: 2026-10-21T15:58:20+09:00
draft: false
tags: ["scraping", "automation", "seo"]
summary: "퀴즈벨은 FAQPage JSON-LD 의 Question/acceptedAnswer 에 날짜별 정답을, DAPS 는 data-copy-answer 속성과 제목의 날짜를 둔다. 둘 다 일반 요청으로 열려 H.Point 퀴즈 정답을 교차 확인했다"
---

## 무슨 일이

H.Point 오늘의 퀴즈를 자동으로 풀면서 정답 출처가 필요했다. 네이버 검색 결과 요약에서 '정답 : 골드바' 를 줍는 방법도 됐지만,
검색 결과는 날마다 모양이 바뀐다. 정답 모음 사이트 두 곳을 열어 보니 정답이 화면 글자보다 먼저 기계용 자리에 있었다.

## 원인

검색 노출([[json-ld|JSON-LD]] 기반 FAQ 리치 결과)을 노린 사이트라서, 정답을 구조화 데이터로 같이 내보낸다.

| 사이트 | 정답이 있는 곳 | 오늘 것인지 |
| --- | --- | --- |
| 퀴즈벨 `answer.quizbells.com/hpoint/today/answer` | `<script type="application/ld+json">` 의 `FAQPage.mainEntity[].acceptedAnswer.text` ("정답은 [골드바] 입니다.") | Question `name` 에 "10월21일 … 퀴즈 정답" |
| DAPS `daps.vuedot.co.kr/apps/hpoint/` | `data-copy-answer="골드바"` | `<title>` 에 "2026년 10월 21일 (오늘)" |

퀴즈벨은 `/today` 에는 정답이 없고 `/today/answer` 에 있다. FAQ 에는 전날 문제도 같이 있어서 날짜로 골라야 한다.

## 재현

```bash
curl -s -A 'Mozilla/5.0' https://answer.quizbells.com/hpoint/today/answer \
  | grep -o '정답은 \[[^]]*\]'
curl -s -A 'Mozilla/5.0' https://daps.vuedot.co.kr/apps/hpoint/ | grep -o 'data-copy-answer="[^"]*"'
```

## 그래서

두 곳에서 오늘 날짜의 정답만 읽고, 둘이 같거나 하나만 있을 때 그 답이 보기에 있으면 낸다. 아니면 네이버 검색을 쓰고, 거기서도 못 찾으면 첫 보기를 고른다.
구현은 `naver/naverpay_click/appcheck.py` 의 `quiz_answer_from_sites` 다.

## 한 줄

검색 유입을 노리는 사이트에서 값을 긁어야 하면 화면 HTML 보다 `application/ld+json` 블록과 `data-*` 속성부터 열어 본다.
