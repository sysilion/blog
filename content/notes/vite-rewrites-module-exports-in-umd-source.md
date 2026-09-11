---
title: "UMD 라이브러리를 src에 넣었더니 Cannot set property default of [object Module]"
date: 2026-09-12T06:20:00+09:00
draft: false
tags: ["vite", "esm", "javascript", "삽질"]
summary: "Vite는 소스에 들어온 `module.exports = ...` 를 자기 내보내기로 고쳐 쓴다. 그 대상이 읽기 전용이라 UMD 래퍼가 거기서 죽는다."
---

## 무슨 일이

타입 없는 [[umd|UMD]] 라이브러리 세 개를 `src/vendor/` 에 넣고 ESM으로 불러 썼다.
브라우저에서는 잘 돌았는데 [[vitest]] 로 테스트를 돌리니 이렇게 죽었다.

```
TypeError: Cannot set property default of [object Module] which has only a getter
 ❯ src/vendor/anime25d/rigger.js:15:63
     15|   if (typeof module !== 'undefined' && module.exports) module.exports = factory();
       |                                                               ^
```

`module.exports` 를 대입하는데 왜 `default` 를 설정한다고 할까.

## 원인

[[vite|Vite]] 의 SSR 변환이 **소스 파일 안의 `module.exports = X` 를 자기 내보내기 객체
대입으로 고쳐 쓴다.** 대략 이렇게 된다.

```js
// 내가 쓴 것
module.exports = factory();

// Vite가 돌리는 것
__vite_ssr_exports__.default = factory();
```

`__vite_ssr_exports__` 는 ES 모듈 네임스페이스라 **getter만 있고 쓸 수 없다.**
그래서 "Cannot set property **default**" 다 — 에러 메시지에 `default` 가 나오는 이유가
여기 있다. 내가 쓴 코드에는 `default` 라는 단어가 없다.

`node_modules` 안의 CommonJS는 `@rollup/plugin-commonjs` 가 제대로 변환한다.
문제는 **소스 트리에 직접 넣은** UMD 파일이다. 그건 ESM으로 간주되면서 이 어중간한
재작성만 걸린다.

## 재현

```js
// src/thing.js
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Thing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return { hello: () => 'hi' };
});
```

```js
// src/thing.test.js
import './thing.js';
test('loads', () => { expect(self.Thing.hello()).toBe('hi'); });
```

`vitest run` → 위 TypeError.

## 그래서

UMD 래퍼에서 **CommonJS 분기를 지우고 전역 경로만 남겼다.** 한 줄이면 끝난다.

```js
(function (root, factory) {
  // CommonJS 분기 삭제 — 번들러가 이 줄을 고쳐 써서 깨진다
  root.Thing = factory();
})(typeof self !== 'undefined' ? self : this, function () { ... });
```

그리고 파일 앞뒤에 두 가지를 덧붙였다.

```js
// 맨 앞 — Node의 ESM에는 self가 없다
if (typeof self === "undefined") globalThis.self = globalThis;

// 맨 뒤 — 번들러가 쓸 수 있게
export default self.Thing;
```

`var module;` 로 가려 보려 했는데 소용없다. Vite가 **토큰을 보고 변환**하므로 런타임에
무엇이 있든 상관이 없다.

## 한 줄

Vite에서 소스 트리의 UMD는 CommonJS 분기를 지우고 써라. 남겨 두면 번들러가 고쳐 쓰고
그 대상은 읽기 전용이다.
