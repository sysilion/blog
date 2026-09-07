---
title: "@Async 메서드를 같은 클래스에서 부르면 조용히 동기 실행된다"
date: 2026-09-07T16:00:00+09:00
draft: false
tags: ["spring", "java"]
summary: "self-invocation 은 AOP 프록시를 지나지 않는다. 예외도 경고도 없이 애노테이션만 사라진다."
---

## 무슨 일이

dealsignal 의 가격 수집 코드가 이렇게 생겼다.

```java
@Scheduled(cron = "0 0 8 * * *")
public void syncAllProducts() {
    List<Product> products = productRepository.findAll();
    log.info("Starting parallel sync for {} products", products.size());
    products.forEach(product -> asyncSyncProduct(product));   // ← this.
}

@Async
@Transactional
public void asyncSyncProduct(Product product) {
    syncProductNow(product);
    Thread.sleep(2000 + random(3000));   // 탐지 회피용 간격
}
```

로그는 "parallel sync" 라고 찍히는데, 실제로는 스케줄러 스레드 하나가
상품 수 × 2~5초 동안 붙잡혀 있었다. 상품 1,000개면 약 1시간.

## 원인

`@Async`·`@Transactional` 은 프록시로 구현된다. 스프링이 빈을 감싼 프록시를
컨테이너에 등록하고, **외부에서 그 프록시를 통해 들어온 호출**만 가로챈다.

`this.asyncSyncProduct(...)` 는 프록시를 거치지 않고 실제 객체의 메서드를
직접 부른다. 그래서 애노테이션이 전부 무효가 된다. 컴파일 경고도, 런타임
예외도 없다. `@Transactional` 도 같이 사라지므로 트랜잭션 경계까지 조용히
바뀐다.

## 재현

```java
@Service
public class Demo {
    public void outer() {
        System.out.println("outer thread: " + Thread.currentThread().getName());
        inner();          // this
    }

    @Async
    public void inner() {
        System.out.println("inner thread: " + Thread.currentThread().getName());
    }
}
```

`outer()` 를 부르면 두 줄의 스레드 이름이 같다. `inner()` 를 밖에서 직접
부르면 다르다.

## 그래서

프록시를 명시적으로 얻어서 부른다. `ObjectProvider` 로 받으면 생성 시점
순환 의존이 생기지 않는다.

```java
private final ObjectProvider<PriceSyncService> selfProvider;
private PriceSyncService self() { return selfProvider.getObject(); }

// self().asyncSyncProduct(product);
```

**다만 고치는 방향을 잘 골라야 한다.** 이 코드에서 `@Async` 를 그냥
"작동하게" 만들면 더 나빠진다. `spring.threads.virtual.enabled: true` 라서
상품 수만큼의 가상 스레드가 한꺼번에 뜨고, 상품마다 2~5초 쉬던 간격이
의미를 잃는다. 탐지 회피가 목적이었던 코드가 정확히 그 반대로 뒤집힌다.

간격이 의도된 것이라면 비동기로 만들 대상은 개별 작업이 아니라 **루프
전체**다.

```java
@Scheduled(cron = "...")
public void syncAllProducts() {
    self().runPacedSync(productRepository.findAllProductIds());  // 스케줄러 스레드 해방
}

@Async
public void runPacedSync(List<String> ids) {
    for (String id : ids) {
        self().syncOneProduct(id);   // @Transactional, 1건 = 1트랜잭션
        sleep(2000, 5000);           // 트랜잭션 밖에서 쉰다
    }
}
```

## 한 줄

self-invocation 은 애노테이션을 침묵 속에 삭제한다. 그리고 그걸 되살릴 때는
원래 그 코드가 왜 느렸는지를 먼저 봐야 한다.
