---
title: "JSON-LD"
date: 2026-10-21T15:58:20+09:00
draft: false
tags: ["web", "seo"]
summary: "페이지의 의미를 schema.org 어휘로 적어 <script type=\"application/ld+json\"> 에 넣는 구조화 데이터 형식."
altnames: ["json-ld", "구조화 데이터", "structured data"]
---

JSON-LD 는 웹 페이지가 무엇에 대한 것인지를 JSON 으로 적어 HTML 안에 넣는 구조화 데이터 형식이다.

## 무엇인가

- `<script type="application/ld+json">` 블록 안에 둔다. 화면에는 보이지 않는다.
- 어휘는 대개 schema.org 를 쓴다. `@type` 이 `FAQPage`, `Product`, `Article`, `BreadcrumbList` 같은 것이고, 여러 개를 `@graph` 배열로 묶기도 한다.
- `FAQPage` 는 `mainEntity` 에 `Question` 들을 두고, 각 질문의 답을 `acceptedAnswer.text` 에 둔다.

## 알아둘 것

- 검색 엔진이 리치 결과(FAQ 펼침, 가격, 별점)를 만들 때 읽는다. 그래서 검색 유입을 노리는 사이트일수록 꼼꼼히 채운다.
- 화면 HTML 보다 구조가 안정적이라 긁어 올 때 먼저 볼 곳이다. 다만 화면과 내용이 다를 수 있다.
- 같은 정보를 HTML 속성으로 다는 방식(마이크로데이터 `itemprop`, RDFa)도 있다.
