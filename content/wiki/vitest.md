---
title: "Vitest"
date: 2026-09-15T04:14:19+09:00
draft: false
tags: ["vite", "테스트"]
summary: "Vite의 변환 파이프라인을 그대로 쓰는 테스트 러너. 그래서 브라우저에서 되던 코드가 여기서만 깨질 수 있다."
altnames: ["vitest"]
---

[[vite|Vite]] 위에서 도는 테스트 러너. 테스트 파일도 Vite 가 변환하므로
`vite.config` 의 alias·플러그인·환경 변수 설정이 **테스트에서 그대로 적용된다.**

## 무엇인가

- API 는 Jest 와 거의 호환된다. `describe` / `it` / `expect` / `vi.mock`.
  `globals: true` 를 켜야 import 없이 전역으로 쓸 수 있고, 기본값은 꺼져 있다.
- 실행 환경은 기본이 `node` 다. DOM 이 필요하면 `environment: 'jsdom'` (또는 `happy-dom`).
- 설정은 `vite.config.ts` 의 `test` 키에 같이 쓰거나 `vitest.config.ts` 로 분리한다.

## 알아둘 것

- **모듈을 Vite 의 SSR 변환으로 올린다.** 브라우저에서 멀쩡히 돌던 코드가 Vitest 에서만
  죽는다면, 테스트 코드보다 이 변환을 먼저 의심한다. `import`/`export` 가 함수 호출과
  네임스페이스 객체로 바뀌어 있고, 그 객체는 **getter 만 있어 쓸 수 없다.**
- Jest 호환이라고 해도 모킹 의미는 다르다. `vi.mock` 은 호이스팅되며 ESM 기준으로 동작한다.
