---
title: "getBoundingClientRect"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["dom", "브라우저"]
summary: "요소의 최종 레이아웃 사각형. 가시성 판정의 마지막 근거."
altnames: ["요소 가시성", "가시성 판정"]
---

요소가 실제로 차지한 사각형을 뷰포트 기준으로 돌려주는 DOM 메서드.
**조상까지 반영된 최종 레이아웃 결과**라는 점이 중요하다.

## 알아둘 것

**요소가 보이는지를 스타일만으로 물으면 틀린다.**
`display` / `visibility` / `opacity` 를 확인해도 걸러지지 않는 경우가 있다 —
부모가 숨겼거나, 크기가 0이거나, 스타일 조합으로 안 보이는 경우 자식의 computed style은 멀쩡하다.

```js
const rect = el.getBoundingClientRect();
return rect.width > 0 && rect.height > 0;
```

안내 팝업을 전부 DOM에 심어두고 상황에 맞는 것만 노출하는 페이지에서 특히 필요하다.
텍스트로 요소를 찾으면 숨겨진 템플릿까지 잡힌다.

가능하면 텍스트 대신 **상태 클래스**를 근거로 삼고, 텍스트 판정은 보조로만 쓴다.
