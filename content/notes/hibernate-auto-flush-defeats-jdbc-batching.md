---
title: "batch_size 를 켰는데 UPDATE 가 한 건씩 나갔다 — 루프 안의 조회"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["spring", "hibernate", "jpa", "dealsignal"]
summary: "엔티티를 고칠 때마다 같은 테이블을 다시 조회하면 FlushMode AUTO 가 밀린 UPDATE 를 먼저 내보낸다. JDBC 배치가 사실상 꺼진다."
---

## 무슨 일이

dealsignal 은 `application.yml` 에 `hibernate.jdbc.batch_size: 50`, `order_updates: true` 가 켜져 있다.
그런데 찜 목록 순서 변경 10건에 SQL 이 20번(SELECT 10 + UPDATE 10) 나갔다.

## 원인

순서 변경 코드가 id 마다 `findBy...` 로 엔티티를 읽고 값을 고쳤다. Hibernate 의 [[flush-mode]] 기본값 `AUTO` 는
쿼리를 실행하기 전에, 그 쿼리 결과에 영향을 줄 수 있는 밀린 변경을 먼저 flush 한다.
같은 테이블을 다시 조회하니 매 반복마다 직전 UPDATE 하나가 홀로 flush 되고, 배치로 묶일 기회가 없다.

## 재현

`@SpringBootTest(properties="spring.jpa.properties.hibernate.generate_statistics=true")` + `@Transactional` 테스트에서

```java
em.flush(); em.clear();
stats.clear();
service.reorder(userId, ids);   // 10건
em.flush();
System.out.println(stats.getPrepareStatementCount());   // 전 20 → 후 2
```

## 그래서

`findByUserIdAndIdIn` 으로 한 번에 읽은 뒤 고치도록 바꿨다. SELECT 1 + 배치 UPDATE 1 = 2번.

## 한 줄

> batch_size 는 상한일 뿐이다. 고칠 엔티티는 루프 밖에서 한 번에 읽어 오고, 수정 루프 안에서는 같은 테이블을 조회하지 않는다.
