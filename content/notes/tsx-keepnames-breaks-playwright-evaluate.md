---
title: "tsx로 돌린 Playwright 스크립트에서 page.evaluate 가 __name is not defined 로 죽는다"
date: 2026-10-22T19:45:38+09:00
draft: false
tags: ["tsx", "playwright", "esbuild"]
summary: "tsx가 함수 이름을 보존하려고 넣는 __name 호출이 브라우저로 직렬화된다. 페이지에는 그 헬퍼가 없다."
---

Orca 모바일 터미널 문서를 헤드리스 Chromium에 띄워 확인하려고 `.mts` 스크립트를 [[tsx]] 로 실행했다.
페이지는 열리는데 터미널이 준비 신호를 한 번도 보내지 않았고, `pageerror` 에는 이 한 줄만 찍혔다.

```
pageerror __name is not defined
```

터미널 코드에는 `__name` 이 없다. 범인은 `page.addInitScript(() => { ... })` 로 넘긴 내 함수였다.

## 원인

tsx는 [[esbuild]] 로 변환하면서 [[esbuild-keep-names|keepNames]] 를 켠다. 그러면 이름이 붙은 함수와 화살표 함수마다
`__name(fn, "double")` 같은 호출이 덧붙고, `__name` 헬퍼는 모듈 맨 위에 정의된다.

[[playwright]] 의 `page.evaluate(fn)` 와 `addInitScript(fn)` 는 `fn.toString()` 을 브라우저로 보낸다.
함수 본문 안의 `__name(...)` 호출은 따라가지만 모듈 스코프의 헬퍼는 따라가지 않는다. 브라우저에서 그 이름을 찾지 못해 터진다.

## 재현

```ts
// repro.mts
import { chromium } from 'playwright'
const page = await (await chromium.launch()).newPage()
await page.evaluate(() => { const double = (n: number) => n * 2; return double(21) })
```

```bash
npx tsx repro.mts
# page.evaluate: ReferenceError: __name is not defined
node repro.mjs   # 타입 표기만 뺀 같은 코드
# 42
```

브라우저로 보내는 코드를 문자열로 넘기면 tsx가 손대지 않는다.

```ts
await page.evaluate('(function(){ const double = (n) => n * 2; return double(21) })()')
// 42
```

## 그래서

- 같은 코드라도 node로 직접 돌리면 멀쩡하다. 변환을 거치는 러너에서만 깨진다면 러너 설정부터 본다.
- 페이지 쪽 에러가 `__name`, `__publicField` 처럼 밑줄 두 개로 시작하는 이름이면 내 코드보다 트랜스파일러 헬퍼를 먼저 의심한다.

## 한 줄

tsx로 Playwright를 돌릴 때 `evaluate`·`addInitScript` 에 넘기는 코드는 문자열로 쓰거나, 그 파일만 `.mjs` 로 빼서 node로 실행한다.
