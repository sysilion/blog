---
title: "overflow: hidden 은 자손의 position: sticky 를 무력화한다 (clip 은 아니다)"
date: 2026-08-28T18:00:00+09:00
draft: false
tags: ["CSS", "레이아웃"]
summary: "간트 바 안의 제목을 sticky로 고정하려는데 전혀 움직이지 않았다. 원인은 바에 걸린 overflow: hidden."
aliases: ["/wiki/overflow-hidden-breaks-sticky/"]
---

## 무슨 일이

가로 간트 타임라인에서 왼쪽 게임 라벨이 `position: sticky; left: 0` 으로 화면에 붙어 있다.
표시 범위보다 먼저 시작한 일정 바는 x가 음수라, 바 제목이 라벨 뒤로 숨어 읽을 수 없었다
(전체 306개 바 중 98개).

제목만 라벨 오른쪽에 붙이려고 sticky를 걸었는데 전혀 움직이지 않았다.

```css
.entry-bar { overflow: hidden; }              /* 제목이 바를 넘지 않게 */
.entry-bar .bar-text {
  position: sticky;
  left: calc(var(--label-w) + 6px);           /* 라벨 오른쪽에 붙어라 */
}
```

## 원인

`overflow: hidden` 인 요소는 **[[scroll-container|스크롤 컨테이너]]**다 (스크롤바가 보이지 않아도 그렇다).
[[position-sticky]] 는 가장 가까운 스크롤 컨테이너를 기준으로 붙는데,
그 기준이 타임라인 스크롤러가 아니라 **바 자신**이 되어 버린다.
바는 자기 안에서 스크롤되지 않으므로 sticky는 아무 일도 하지 않는다.

[[overflow|overflow: clip]] 은 넘치는 부분을 자르면서도 스크롤 컨테이너를 만들지 않는다.
한 글자만 바꾸면 기준이 다시 바깥 스크롤러가 된다.

```css
.entry-bar { overflow: clip; }
```

## 재현

```html
<div id="sc" style="width:200px;overflow:auto;border:1px solid">
  <div style="width:800px">
    <div style="overflow:hidden;width:400px;background:#eee">
      <span id="s1" style="position:sticky;left:0;background:gold">HIDDEN</span>
    </div>
    <div style="overflow:clip;width:400px;background:#ddd">
      <span id="s2" style="position:sticky;left:0;background:lightgreen">CLIP</span>
    </div>
  </div>
</div>
<script>
  const L = el => Math.round(el.getBoundingClientRect().left);
  sc.scrollLeft = 0;   const before = [L(s1), L(s2)];
  sc.scrollLeft = 150; const after  = [L(s1), L(s2)];
  console.log({ hiddenMoved: after[0]-before[0], clipMoved: after[1]-before[1] });
</script>
```

Chrome 실측:

```
{ hiddenMoved: -150, clipMoved: 0 }
```

`hidden` 쪽은 스크롤량 그대로 왼쪽으로 밀려 나간다 — sticky가 아예 걸리지 않았다.
`clip` 쪽은 0px, 스크롤러 왼쪽 끝에 붙어 있다.
`getComputedStyle(...).overflowX` 로 `hidden` / `clip` 을 구분할 수는 있지만,
sticky가 죽었다는 신호는 어디에도 나오지 않는다.

## 그래서

- flex item을 sticky로 쓸 때는 `min-width: 0` 도 같이 필요하다. 기본값 `auto` 는
  `white-space: nowrap` 텍스트를 줄이지 않아, 텍스트가 부모보다 넓어지면 sticky가 이동할 여유가 0이 된다.
- `::before` / `::after` 는 `inset: 0` 절대 배치로 쓰는 순간 sticky가 될 수 없다.
  스크롤을 따라와야 하는 배경 레이어는 실제 요소로 만들고, `margin-bottom: -(높이)` 로
  흐름에서 빼내 다음 형제가 그 위에 겹치게 하면 된다.

## 한 줄

`overflow: hidden` 은 조용히 스크롤 컨테이너를 만든다. 안쪽 sticky가 죽으면 여기를 먼저 보라.
