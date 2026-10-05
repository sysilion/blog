---
title: "삼값 논리"
date: 2026-10-05T23:25:49+09:00
draft: false
tags: ["sql", "database"]
summary: "SQL 의 조건식은 TRUE·FALSE·UNKNOWN 세 값을 가진다. NULL 과 비교하면 UNKNOWN 이 나온다."
altnames: ["three-valued logic", "3VL", "삼치 논리"]
---

**삼값 논리**(three-valued logic)는 조건식의 결과로 TRUE, FALSE 말고 **UNKNOWN** 까지 세 값을 쓰는 논리다. SQL 이 NULL 을 다루는 방식이다.

## 무엇인가

NULL 은 "값을 모른다"는 뜻이다. 그래서 NULL 과 비교한 결과도 모른다(UNKNOWN). SQL 에서는 이 UNKNOWN 을 NULL 로 표현한다.

| 식 | 결과 |
| --- | --- |
| `NULL = 1` | UNKNOWN |
| `NULL <> 1` | UNKNOWN |
| `NULL IN (1, 2)` | UNKNOWN |
| `NULL NOT IN (1, 2)` | UNKNOWN |
| `1 NOT IN (2, NULL)` | UNKNOWN |
| `NOT UNKNOWN` | UNKNOWN |
| `UNKNOWN OR TRUE` | TRUE |
| `UNKNOWN AND FALSE` | FALSE |

`WHERE`, `ON`, `HAVING` 은 **TRUE 인 행만** 남긴다. UNKNOWN 은 FALSE 와 똑같이 버려진다.
반대로 `CHECK` 제약은 UNKNOWN 을 통과시킨다.

## 알아둘 것

- 제외 조건 `col NOT IN (...)` 은 `col` 이 NULL 인 행을 버린다. 남기려면 `col IS NULL OR ...` 을 붙인다.
- 목록 쪽에 NULL 이 하나라도 섞이면 `x NOT IN (서브쿼리)` 는 **어떤 행에도** TRUE 가 되지 않는다. `NOT EXISTS` 는 이 함정이 없다.
- NULL 을 비교하려면 `IS NULL`, `IS DISTINCT FROM` 을 쓴다.

```sql
SELECT NULL NOT IN ('a');            -- NULL
SELECT NULL IS DISTINCT FROM 'a';    -- true
```
