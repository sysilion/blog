---
title: "self-invocation"
date: 2026-10-27T22:09:36+09:00
draft: false
tags: ["spring", "java", "aop"]
summary: "같은 빈 안에서 this 로 메서드를 부르는 것. 스프링 AOP 프록시를 지나지 않아 애노테이션이 적용되지 않는다."
altnames: ["자기 호출", "spring self-invocation", "self invocation"]
---

self-invocation 은 스프링 빈이 자기 자신의 메서드를 `this.method()` 로 부르는 것이다.

## 무엇인가

`@Transactional`, `@Async`, `@Cacheable` 같은 애노테이션은 스프링이 빈을 감싼 프록시가 처리한다.
컨테이너에 등록되는 것은 그 프록시이고, 다른 빈이 주입받아 부르는 호출만 프록시를 지난다.

```text
다른 빈 ──▶ 프록시(트랜잭션 시작) ──▶ 실제 객체.a()
                                         └─ this.b()   ← 프록시를 안 지남
```

`a()` 안에서 부른 `b()` 는 실제 객체의 메서드가 바로 실행되므로 `b()` 에 붙은 애노테이션은 무시된다.
컴파일 경고나 기동 시 경고는 없다.

## 알아둘 것

- 증상은 애노테이션마다 다르다. `@Async` 는 동기로 실행될 뿐 오류가 없다.
  `@Transactional` 은 바깥에 트랜잭션이 없으면 `@Modifying` 쿼리나 `flush` 에서 `TransactionRequiredException` 이 난다.
- `@Scheduled`, `@EventListener` 진입점은 프록시를 거쳐 호출되지만, 그 메서드 안에서 같은 클래스의 다른 메서드를 부르면 다시 self-invocation 이다.
- 우회 방법은 프록시를 직접 받아 부르는 것이다. `ObjectProvider<Self>` 로 받으면 생성 시점의 순환 의존이 생기지 않는다.
  메서드를 다른 빈으로 옮기거나 `TransactionTemplate` 으로 경계를 코드에 적는 방법도 있다.
- AspectJ weaving 모드(`mode = AdviceMode.ASPECTJ`)에서는 프록시가 아니라 바이트코드에 직접 들어가므로 이 제약이 없다.
