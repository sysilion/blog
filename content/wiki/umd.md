---
title: "UMD"
date: 2026-09-12T06:20:00+09:00
draft: false
tags: ["javascript", "모듈"]
summary: "CommonJS·AMD·브라우저 전역 중 무엇이든 되는 환경에 맞춰 스스로를 내보내는 자바스크립트 배포 형식."
altnames: ["Universal Module Definition"]
---

한 파일이 **CommonJS · AMD · 브라우저 전역** 중 어디에 놓이든 알아서 자기를 내보내게 하는
관용 패턴. 표준이 아니라 손으로 쓰는 래퍼다.

## 무엇인가

```js
(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.MyLib = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return { /* 실제 라이브러리 */ };
});
```

ESM이 자리잡기 전, 라이브러리 하나를 `<script>` 태그·npm·RequireJS에 동시에 내놓으려면
이 방법뿐이었다. 지금도 브라우저 CDN 배포판(`*.umd.js`, `*.min.js`)에 많이 남아 있다.

## 알아둘 것

- **분기 순서가 곧 우선순위다.** 대개 AMD → CommonJS → 전역 순이고, 앞의 것이 있으면
  전역에는 아무것도 남지 않는다.
- `root` 를 `typeof self !== 'undefined' ? self : this` 로 잡는 관용구가 흔한데,
  **Node의 ESM에서는 `self` 도 `this` 도 없다.** 그래서 `import` 만으로는 못 불러온다.
- **번들러가 `module.exports = ...` 를 고쳐 쓸 수 있다.** `node_modules` 안이면 CommonJS
  변환이 제대로 걸리지만, 소스 트리에 직접 넣은 UMD는 어중간하게 재작성돼 깨진다.
  → [[vite-rewrites-module-exports-in-umd-source]]
- 새로 만드는 라이브러리라면 쓸 이유가 없다. ESM으로 내고 필요하면 빌드로 UMD를 함께 낸다.
