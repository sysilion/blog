---
title: "StrictMode에서 async 초기화는 정리해도 살아남는다"
date: 2026-09-11T15:40:00+09:00
draft: false
tags: ["react", "typescript", "삽질"]
summary: "cleanup이 먼저 돌고 나서 await가 풀리면, 죽은 인스턴스가 리스너와 rAF 루프를 다시 붙인다."
---

## 무슨 일이

캔버스 렌더 루프를 클래스로 빼고 effect에서 붙였다 떼는 흔한 구조다.

```tsx
useEffect(() => {
  const stage = new Stage(canvas, { onMenu: setMenu });
  stage.start().catch(setError);      // async
  return () => stage.dispose();
}, []);
```

드래그가 안 먹었다. `mousedown`은 오는데(Rust 쪽 로그로 확인) 캐릭터가 커서를 안 따라온다.

## 원인

[[react-strict-mode|React StrictMode]]는 개발 모드에서 effect를 **붙이고 → 정리하고 → 다시 붙인다.**

`start()`가 `await` 중일 때 `dispose()`가 먼저 돈다. `dispose()`는 그 시점의
정리 목록을 비우지만, 목록은 아직 비어 있다. 그러고 나서 await가 풀리면 죽었어야 할 1번 인스턴스가

- DOM 리스너를 붙이고
- `requestAnimationFrame` 루프를 돌리고
- 자기 캐릭터를 스폰한다

2번 인스턴스도 똑같이 한다. 같은 캔버스에 두 루프가 `clearRect`를 번갈아 치고,
`mousedown` 리스너가 둘 다 걸려 있고, 캐릭터가 두 마리다.
집어 든 쪽과 화면에 보이는 쪽이 달랐던 것이다.

## 재현

```ts
async start() {
  await somethingSlow();          // 이 사이에 dispose()가 지나간다
  window.addEventListener("mousemove", this.onMove);   // 유령이 붙인다
  this.raf = requestAnimationFrame(this.tick);
}
```

## 그래서

await를 지날 때마다 폐기 여부를 확인한다.

```ts
private disposed = false;

async start() {
  const info = await overlayInfo(this.label);
  if (this.disposed) return;
  const character = await loadCharacter(url);
  if (this.disposed) return;
  // ... 여기서부터 리스너/루프를 붙인다
}

dispose() {
  this.disposed = true;
  ...
}
```

await 뒤에 이미 등록해 둔 구독이 있다면 그 자리에서 직접 해제하고 빠져야 한다.
`disposers` 배열은 이미 비워진 뒤라 나중에 push해 봐야 아무도 안 부른다.

StrictMode를 끄면 증상은 사라지지만 원인은 남는다. 프로덕션에서도 마운트/언마운트가
빠르게 반복되면 같은 일이 벌어진다.

## 한 줄

`useEffect`의 cleanup은 async 초기화가 끝나기를 기다려 주지 않는다. **await마다 확인해야 한다.**
