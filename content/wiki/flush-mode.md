---
title: "FlushMode"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["hibernate", "jpa"]
summary: "Hibernate/JPA 가 영속성 컨텍스트의 밀린 변경을 언제 DB 로 내보낼지 정하는 설정."
altnames: ["flush mode", "auto flush", "FlushModeType"]
---

FlushMode 는 JPA·Hibernate 가 메모리(영속성 컨텍스트)에 쌓인 INSERT/UPDATE/DELETE 를 **언제** DB 로 보낼지 정한다.

## 구조

| 모드 | 언제 flush 하나 |
| --- | --- |
| `AUTO` (기본) | 커밋 직전 + **쿼리 실행 전에 그 쿼리 결과에 영향을 줄 수 있는 변경이 있으면** |
| `COMMIT` | 커밋 직전에만 |
| `MANUAL` (Hibernate) | `flush()` 를 직접 부를 때만 |

## 알아둘 것

- `AUTO` 의 "쿼리 전 flush" 때문에, 수정과 같은 테이블 조회를 번갈아 하면 변경이 한 건씩 나간다. `hibernate.jdbc.batch_size` 가 켜져 있어도 배치로 묶이지 않는다.
- 해결은 대개 모드 변경이 아니라 **먼저 한꺼번에 읽고, 그 다음 고치는** 순서로 바꾸는 것이다.
