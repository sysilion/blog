---
title: "움직이는 파비콘은 canvas로만 된다"
date: 2026-08-27T16:55:00+09:00
draft: false
tags: ["브라우저", "favicon", "canvas"]
summary: "SVG 애니메이션도 GIF/APNG도 파비콘으로는 안 움직인다. 매 프레임 href를 갈아끼우는 수밖에 없다."
aliases: ["/wiki/animated-favicon-needs-canvas/"]
---

## 무슨 일이

SVG [[favicon|파비콘]]에 CSS/SMIL 애니메이션을 넣었다. 탭에서 안 움직인다. GIF와 APNG로 바꿔도 안 움직인다.

## 원인

Chrome/Edge/Opera는 **파비콘 SVG를 정적 모드로 렌더링한다.** 애니메이션 선언을 무시한다.
파비콘으로 쓰인 APNG/GIF도 마찬가지로 첫 프레임에서 멈춘다.

## 그래서

모든 브라우저에서 통하는 유일한 방법은 **canvas로 프레임을 그려 `<link rel="icon">`의 `href`를
교체하는 것**이다.

```js
function render(t) {
    draw(t);
    link.href = canvas.toDataURL("image/png");
}

setInterval(function () {
    if (document.hidden) return;      // 숨은 탭에서는 그리지 않는다
    render((Date.now() - start) / 1000);
}, 1000 / 12.5);                       // 80ms — 탭 아이콘엔 충분
```

세 가지를 챙겼다.

- **12.5fps면 충분하다.** 16×16으로 축소되는 그림에 60fps는 낭비다.
- **`document.hidden`이면 건너뛴다.** 안 보이는 탭에서 `toDataURL`을 계속 돌릴 이유가 없다.
  숨은 탭 타이머는 어차피 1초로 스로틀된다.
- **첫 프레임은 무조건 그린다.** 백그라운드 탭에서 로드되면 아이콘이 비어버리기 때문이다.

canvas는 64×64로 그린다(레티나 대응). 브라우저가 알아서 줄인다.

## 한 줄

> 파비콘 애니메이션은 이미지 포맷의 문제가 아니라 **렌더 모드**의 문제다. 프레임을 직접 밀어 넣어라.
