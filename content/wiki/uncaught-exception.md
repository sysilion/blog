---
title: "uncaughtException"
date: 2026-10-18T19:33:51+09:00
draft: false
tags: ["nodejs", "런타임"]
summary: "어디서도 잡히지 않은 예외. Node는 기본적으로 프로세스를 종료한다."
altnames: ["uncaught exception", "unhandled rejection", "처리되지 않은 예외"]
---

호출 스택 어디에서도 `try/catch` 로 잡히지 않고 이벤트 루프까지 올라온 예외.

## 무엇인가

- 동기 예외가 끝까지 올라오면 `process` 의 `'uncaughtException'` 이벤트가 발생한다.
  리스너가 없으면 스택을 찍고 종료 코드 1로 끝난다.
- 거부된 Promise를 아무도 처리하지 않으면 `'unhandledRejection'`. Node 15부터
  기본 동작(`--unhandled-rejections=throw`)이 이것을 uncaughtException 으로 바꿔 역시 종료한다.
- `EventEmitter.emit` 은 리스너를 동기 호출한다. 리스너가 던지면 `emit` 을 부른 쪽
  (소켓 데이터 처리 코드)으로 전파되고, 거기서도 안 잡히면 위와 같다.

## 알아둘 것

- 서버에서는 "요청 하나의 실패"가 아니라 **프로세스 전체의 종료**다. 원격 입력을 다루는
  리스너·async 핸들러에서 던질 수 있는 지점은 곧 DoS 지점이다.
- `process.on('uncaughtException')` 으로 삼키는 것은 상태가 깨진 채 계속 도는 것이라
  권장되지 않는다. 입력 검증과 국소적 `try/catch` 가 먼저다.
- `JSON.parse` 결과는 객체라는 보장이 없다. `null`, 숫자, 배열 모두 유효한 JSON이다.
