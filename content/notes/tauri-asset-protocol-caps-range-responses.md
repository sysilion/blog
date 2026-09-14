---
title: "Tauri asset 프로토콜은 Range 응답을 1MB에서 끊는다"
date: 2026-09-15T02:40:00+09:00
draft: false
tags: ["tauri", "http"]
summary: "2.7MB짜리 썸네일을 Range로 달라고 했더니 1MB만 왔다. 잘린 PNG는 오류 없이 위쪽 몇 줄만 그려진다."
---

## 무슨 일이

데스크탑 마스코트 앱에서 캐릭터 목록에 미리보기를 붙였다. VRM(3D 모델)은 파일이 18MB라
통째로 읽을 수 없어, 앞부분만 읽어 파일 안에 박힌 썸네일의 위치를 계산한 뒤
[[range-request|Range 요청]]으로 그 구간만 집어 오게 했다.

그런데 화면에는 **머리 윗부분만** 나오고 아래는 까맸다. 파일에서 직접 꺼내 본 썸네일은
2048×2048 얼굴 정면으로 멀쩡했다. 계산도 맞았다 — 꺼낸 바이트는 PNG 매직
`89504e47` 로 시작했다.

## 원인

받아 온 바이트가 모자랐다. 썸네일은 2,749,628바이트인데 [[tauri]]의 asset 프로토콜은
Range 응답 하나를 **1000×1024바이트에서 끊는다.**

```rust
// tauri-2.11.5/src/protocol/asset.rs:118
/// The Maximum bytes we send in one range
const MAX_LEN: u64 = 1000 * 1024;
...
end = start + (end - start).min(len - start).min(MAX_LEN - 1);
```

규격상 서버는 요청보다 좁은 구간을 줘도 된다. 문제는 **잘린 PNG가 오류를 내지 않는다는
것**이다. 디코더는 있는 만큼만 그리고 끝낸다. 2.7MB 중 1MB면 위쪽 37%쯤, 그래서
머리카락만 나왔다. 미리보기가 안 뜨는 게 아니라 이상하게 뜨니 원인을 파일 쪽에서
찾게 된다.

같은 이유로 "앞부분 3MB를 읽는다"고 써 둔 코드도 실제로는 1MB만 읽고 있었다.
JSON 청크가 141KB라 우연히 동작하고 있었을 뿐이다.

## 재현

```js
const res = await fetch(assetUrl, { headers: { Range: "bytes=0-2999999" } });
console.log(res.status, (await res.arrayBuffer()).byteLength);
// 206 1024000   ← 3,000,000을 달라고 했는데 1,024,000만 온다
```

## 그래서

요청한 만큼 모일 때까지 **이어 받는다.** 받은 만큼 시작점을 옮겨야 한다.

```ts
let got = 0;
const chunks = [];
while (got < length) {
  const res = await fetch(url, {
    headers: { Range: `bytes=${start + got}-${start + length - 1}` },
  });
  if (!res.ok) break;
  const body = new Uint8Array(await res.arrayBuffer());
  if (res.status !== 206) return { body, partial: false }; // Range를 무시하고 전체를 줬다
  if (body.byteLength === 0) break;                        // 파일이 더 짧다
  chunks.push(body);
  got += body.byteLength;
}
```

## 한 줄

Range 응답은 요청한 만큼 온다고 믿으면 안 된다 — **받은 길이를 세라.**
