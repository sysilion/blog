---
title: "카테고리 제외 필터를 걸면 카테고리 없는 상품이 전부 사라진다"
date: 2026-10-05T23:25:49+09:00
draft: false
tags: ["sql", "postgresql", "jpql", "dealsignal"]
summary: "p.category NOT IN (...) 은 category 가 NULL 인 행을 참으로 보지 않는다."
---

## 무슨 일이

dealsignal 에서 `두근두근상투과자` 를 검색하면 결과가 0건이었다. DB 에는 상품이 있고, 필터 없이 검색하면 잘 나왔다.
사용자는 `패션`, `스포츠` 카테고리를 **제외**한 상태로 검색하고 있었다.

## 원인

이 상품은 `category` 가 NULL 이었고, 제외 필터 조건은 이렇게 생겼다.

```sql
AND (:excludedCategories IS NULL OR p.category NOT IN :excludedCategories)
```

`NULL NOT IN ('패션','스포츠')` 의 결과는 참이 아니라 NULL 이다. [[삼값 논리]] 때문에 WHERE 절이 그 행을 버린다.
제외 필터를 하나라도 켜면 카테고리 미분류 상품 399개가 함께 사라지고 있었다.

## 재현

```sql
SELECT NULL NOT IN ('패션','스포츠');   -- NULL (true 가 아니다)

SELECT count(*) FROM products WHERE name LIKE '%상투%' AND category NOT IN ('패션','스포츠');
-- 0
SELECT count(*) FROM products WHERE name LIKE '%상투%' AND (category IS NULL OR category NOT IN ('패션','스포츠'));
-- 1
```

## 그래서

NULL 을 명시적으로 살렸다.

```sql
AND (:excludedCategories IS NULL OR p.category IS NULL OR p.category NOT IN :excludedCategories)
```

같은 파일의 키워드 제외는 `NOT EXISTS` 로 쓰여 있어서 이 문제가 없었다.

**한 줄: 제외 조건을 `NOT IN` 으로 쓰면 NULL 행도 같이 빠진다. `IS NULL OR` 을 붙이거나 `NOT EXISTS` 를 쓴다.**
