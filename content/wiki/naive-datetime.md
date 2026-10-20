---
title: "naive datetime"
date: 2026-10-21T02:56:53+09:00
draft: false
tags: ["python", "datetime", "timezone"]
summary: "시간대 정보(tzinfo)가 없는 시각. 어느 기준의 벽시계인지는 값이 아니라 코드의 약속에만 있다."
altnames: ["naive", "aware datetime", "tzinfo"]
---

시간대 정보가 붙지 않은 시각 값이다. Python에서는 `tzinfo` 가 `None` 인 `datetime` 을 말한다.

## 무엇인가

- **naive**: `datetime(2026, 10, 21, 2, 45)`. 이것만으로는 KST 02:45인지 UTC 02:45인지 알 수 없다.
- **aware**: `datetime(2026, 10, 21, 2, 45, tzinfo=timezone(timedelta(hours=9)))`. 한 순간을 정확히 가리킨다.
- ISO 문자열에서는 끝에 `+09:00`·`Z` 같은 오프셋이 있느냐로 구분된다.

## 알아둘 것

- naive끼리, aware끼리는 비교할 수 있다. 둘을 섞어 비교하거나 빼면 `TypeError` 가 난다.
- JavaScript `new Date("2026-10-20T17:45:36")` 는 오프셋 없는 문자열을 **현지 시각**으로 읽는다.
  서버가 UTC를 naive로 내보내면 브라우저에서 시차만큼 어긋난다.
- 저장소가 시간대를 지원하지 않으면 aware 값도 naive가 되어 돌아온다. SQLite가 그렇다.
  저장 기준(보통 UTC)을 하나로 정하고, 경계(API 응답)에서 오프셋을 붙인다.
- 외부 API가 오프셋 없이 주는 시각(예: 치지직 `publishDate` 는 KST)은 받는 즉시 어느 기준인지 정해 둔다.
