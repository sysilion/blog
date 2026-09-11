---
title: "React StrictMode"
date: 2026-09-11T15:40:00+09:00
draft: false
tags: ["react", "javascript"]
summary: "개발 모드에서 effect를 일부러 두 번 실행해 정리 누락을 드러내는 개발 도구."
altnames: ["StrictMode", "엄격 모드"]
---

**StrictMode**는 React의 개발 전용 래퍼다. 렌더링 중 부수효과나 정리(cleanup) 누락처럼
나중에 문제가 될 패턴을 개발 단계에서 드러낸다. 프로덕션 빌드에서는 아무 일도 하지 않는다.

React 18부터는 effect를 **붙이고 → 정리하고 → 다시 붙이는** 동작이 추가됐다.
정리 함수가 실제로 원상복구를 하는지 검사하는 것이다.

```tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

## 알아둘 것

`useEffect`의 cleanup은 **async 초기화가 끝나기를 기다려 주지 않는다.**
초기화가 `await` 중일 때 cleanup이 먼저 돌면, await가 풀린 뒤 죽었어야 할 인스턴스가
리스너와 타이머를 다시 붙인다. 그 결과 인스턴스가 둘이 되고 서로 간섭한다.

async 초기화에는 폐기 플래그를 두고 **await를 지날 때마다 확인해야 한다.**
이건 StrictMode만의 문제가 아니라, 마운트/언마운트가 빠르게 반복되면 프로덕션에서도 생긴다.
