---
title: "overflow: hidden 을 건 flex 아이템은 flex-shrink 에 짓눌려 내용이 사라진다"
date: 2026-09-08T11:20:00+09:00
draft: false
tags: ["CSS", "레이아웃"]
summary: "지도 목록 카드가 26px로 찌그러졌다. 원인은 좌측 액센트 바를 자르려고 걸어둔 overflow: hidden."
---

## 무슨 일이

`redtable_point` 지도 사이트의 매장 목록을 반응형으로 고치는 중, 태블릿 폭(768px)에서
카드 목록을 2단으로 바꾸자 카드가 전부 26px 높이로 찌그러졌다. 56px 썸네일이 카드보다
크고, 제목과 주소는 보이지 않았다.

측정해 보니 카드의 안쪽 영역 높이가 아예 0이었다.

```js
card.offsetHeight                              // 26  (= padding 24 + border 2)
card.querySelector('.card-info').offsetHeight  // 0
card.style.overflow = 'visible'
card.offsetHeight                              // 92
```

## 원인

카드에 걸어둔 `overflow: hidden` 이다. 좌측 카테고리 액센트 바를
`position: absolute` 인 `::before` 로 그린 뒤, 그게 둥근 모서리를 삐져나가지 않게
자르려고 넣은 한 줄이었다.

`overflow` 가 `visible` 이 아니면 그 요소는 [[scroll-container]] 가 된다. 그리고
스크롤 컨테이너의 [[automatic-minimum-size]] 는 내용 크기가 아니라 **0** 이다.
부모가 아이템들을 다 담지 못하면 `flex-shrink` 는 이 0까지 마음껏 줄일 수 있고,
패딩과 테두리만 남는다. 내용이 넘쳐서 잘리는 게 아니라 **아이템 자체가 눌린다.**

## 재현

목록 높이(120px)보다 카드 총합이 큰 상황을 만들면 된다.

```html
<style>
  .list { height: 120px; overflow-y: auto; display: flex; flex-direction: column; }
  .card { padding: 12px; border: 1px solid #ccc; }
  .clip { overflow: hidden; }          /* 이 한 줄이 차이를 만든다 */
  .safe { min-height: fit-content; }   /* 자동 최소 크기를 되살리는 처방 */
</style>
<div class="list"><div class="card clip">가게</div><!-- 4개 --></div>
<div class="list"><div class="card">가게</div><!-- 4개 --></div>
<div class="list"><div class="card clip safe">가게</div><!-- 4개 --></div>
```

```
overflow:hidden                  → 30px   (텍스트가 사라진다)
overflow:visible                 → 46px
hidden + min-height:fit-content  → 46px
```

Chrome 154 에서 확인. 카드를 `<button>` 으로 만들었을 때도 같았다 — 요소 종류와 무관하다.

## 그래서

`overflow` 를 지우고, 액센트 바를 배경 그라디언트로 그렸다. 배경은 `border-radius` 가
알아서 잘라 주므로 자를 일이 없어진다.

```css
.store-card {
  background: linear-gradient(to right, var(--chip-fg) 3px, var(--surface) 3px);
}
```

`min-height: fit-content` 로 막을 수도 있지만, 애초에 자를 필요를 없애는 쪽이 낫다.
`overflow: hidden` 은 [[position-sticky]] 도 조용히 무력화하는데, 원인이 다른 것 같아도
결국 같은 뿌리다 — 눈에 보이지 않는 스크롤 컨테이너가 하나 생긴 것.

덧붙여, 앱에서 실제로 증상이 난 건 2단 **그리드** 목록이었다. 그리드 아이템만 따로
떼어 재현하려니 되지 않았고, 위 flex 재현만 확실히 잡혔다. 어느 쪽이든 의심할 곳은
같다: flex/grid 아이템에 걸린 `overflow`.

## 한 줄

`overflow: hidden` 은 잘라내기 지시가 아니라 **스크롤 컨테이너 선언**이고,
그 선언은 flex 아이템의 최소 높이를 0으로 만든다.
