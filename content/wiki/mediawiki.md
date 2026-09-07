---
title: "MediaWiki"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["mediawiki", "api"]
summary: "위키 소프트웨어. /w/api.php 로 구조화된 질의를 받는다."
altnames: ["api.php", "cargoquery"]
---

**MediaWiki** 는 위키백과가 쓰는 위키 소프트웨어다. HTML 페이지 외에
`/w/api.php` 액션 API로 구조화된 데이터를 내준다.

Cargo 확장이 깔린 위키는 `action=cargoquery` 로 표 데이터를 SQL 비슷하게 질의할 수 있다.
HTML을 파싱하는 것보다 훨씬 안정적이다.

```text
GET /w/api.php?action=cargoquery&tables=banners&fields=NameEN&limit=5&format=json
```

## 알아둘 것

**API 경로라고 [[bot-detection|차단]] 예외가 아니다.** 위키가 CDN·WAF 뒤에 있으면
엣지 레이어는 그게 API 엔드포인트인지 신경 쓰지 않고 [[datacenter-ip|데이터센터 IP]] 기준으로 막는다.
"HTML 스크래핑만 차단된다"는 전제로 API 경로에 프록시를 빼두면 CI에서만 403이 온다.
