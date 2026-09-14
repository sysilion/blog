---
title: "Vite"
date: 2026-09-15T04:14:19+09:00
draft: false
tags: ["vite", "bundler", "frontend"]
summary: "개발 중에는 네이티브 ESM으로 그대로 서빙하고 프로덕션은 Rollup으로 묶는 빌드 도구. 두 경로가 달라서 한쪽에서만 나는 버그가 생긴다."
altnames: ["vite", "비트"]
---

프런트엔드 빌드 도구. 개발 서버는 번들을 만들지 않고 소스를 **요청이 올 때 변환해서**
네이티브 ES 모듈로 내보내고, 프로덕션 빌드는 Rollup 으로 묶는다.

## 무엇인가

- **개발**: 소스 파일은 그때그때 변환만 한다. 대신 `node_modules` 의존성은 esbuild 로 미리
  한 번 묶어 캐시한다 → [[vite-optimizedeps|optimizeDeps]].
- **프로덕션**: Rollup 이 전부 번들링한다. 사전 번들링 단계는 없다.
- 플러그인은 Rollup 플러그인 인터페이스에 Vite 전용 훅(`configureServer`, `transformIndexHtml` 등)을
  더한 형태다. 그래서 Rollup 플러그인이 대체로 그대로 돈다.
- 환경 변수는 `import.meta.env` 로 들어오고, `.env` 에서 **`VITE_` 접두사가 붙은 것만**
  클라이언트 번들에 노출된다.

## SSR 변환

Node 에서 모듈을 돌려야 할 때(SSR, 그리고 [[vitest|Vitest]])는 ESM 문법을 그대로 실행하지 않고
함수 호출로 고쳐 쓴다.

```js
import x from 'y'   →   const __vite_ssr_import_0__ = await __vite_ssr_import__('y')
export default z    →   __vite_ssr_exports__.default = z
```

## 알아둘 것

- **개발과 프로덕션의 변환 경로가 다르다.** 한쪽에서만 재현되는 버그라면 이 차이부터 의심한다.
  esbuild(dev)와 Rollup(build)은 같은 코드를 늘 같게 다루지 않는다.
- `node_modules` 안의 CommonJS 는 `@rollup/plugin-commonjs` 가 제대로 변환하지만,
  **소스 트리에 직접 넣은** CJS·UMD 파일은 ESM 으로 간주되어 어중간하게 재작성된다.
