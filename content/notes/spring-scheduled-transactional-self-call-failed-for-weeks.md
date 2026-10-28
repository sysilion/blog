---
title: "@Scheduled 에서 this 로 부른 @Transactional 재계산이 7주 동안 매일 실패했다"
date: 2026-10-27T22:09:36+09:00
draft: false
tags: ["spring", "java", "dealsignal"]
summary: "수동 API 로는 되던 @Modifying 쿼리가 스케줄에서는 트랜잭션 없이 돌아 매번 예외. catch 가 로그 한 줄로 삼켰다."
---

## 무슨 일이

dealsignal 의 "기본가 인하" 필터에 잡히는 상품 수가 이상하다는 얘기가 나와서 확인했다.
`products.base_price_drop_since` 의 최댓값이 `2026-09-04` 였다. 기능을 추가한 날이다.
그 뒤로 값이 한 번도 갱신되지 않았다.

로그에는 매일 03:30 에 같은 줄이 있었다.

```text
ERROR c.s.d.service.BasePriceDropService : Base price drop refresh failed
org.springframework.dao.InvalidDataAccessApiUsageException: No EntityManager with actual
transaction available for current thread - cannot reliably process 'flush' call
```

## 원인

```java
@Scheduled(cron = "0 30 3 * * *")
public void scheduledRefresh() {
    try {
        refresh();                       // this.refresh()
    } catch (Exception e) {
        log.error("Base price drop refresh failed", e);
    }
}

@Transactional
public int refresh() {
    productRepository.refreshBasePriceDrop(windowStart);   // @Modifying(flushAutomatically = true)
    ...
}
```

`refresh()` 를 같은 클래스에서 부르는 [[spring-self-invocation]] 이라 `@Transactional` 이 적용되지 않았다.
`@Modifying(flushAutomatically = true)` 쿼리는 실행 전에 flush 를 하는데 열린 트랜잭션이 없어서 예외가 났다.

수동 갱신용 `POST /api/products/refresh-base-price-drop` 은 컨트롤러가 주입받은 프록시로 `refresh()` 를 부른다.
그래서 개발할 때 손으로 돌려 본 결과는 정상이었다. 스케줄 경로만 깨져 있었다.

`@Async` self-invocation 은 동기 실행으로 바뀔 뿐 오류가 없지만([[spring-async-self-invocation|이전 노트]]), 이번에는 예외가 났다.
그런데 스케줄러를 죽이지 않으려고 넣은 `catch` 가 ERROR 로그 한 줄만 남기고 끝냈다.

## 재현

```java
@SpringBootTest
class BasePriceDropServiceTest {
    @Autowired BasePriceDropService service;
    @MockitoBean ProductRepository productRepository;

    @Test
    void scheduledRefreshRunsInTransaction() {
        AtomicBoolean inTx = new AtomicBoolean();
        when(productRepository.refreshBasePriceDrop(any())).thenAnswer(i -> {
            inTx.set(TransactionSynchronizationManager.isActualTransactionActive());
            return 0;
        });
        service.scheduledRefresh();
        assertThat(inTx).isTrue();     // this.refresh() 면 false
    }
}
```

## 그래서

`ObjectProvider<BasePriceDropService>` 로 자기 프록시를 받아 `selfProvider.getObject().refresh()` 로 부르게 고쳤다.
같은 저장소의 `PriceSyncService` 가 이미 쓰던 방식이다.

## 한 줄

스케줄 작업을 try/catch 로 감쌌다면 그 ERROR 로그가 매일 찍히는지 한 번은 grep 해 본다. 수동 API 로 돌려 본 결과만으로 스케줄 경로까지 확인한 셈 치지 않는다.
