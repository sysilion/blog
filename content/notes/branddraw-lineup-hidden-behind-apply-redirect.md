---
title: "브랜드뽑기 라인업은 오픈 전에도 화면에 있다 — 당첨이 살아 있으면 목록 API 까지 못 간다"
date: 2026-09-17T17:02:00+09:00
draft: false
tags: ["naverpay", "playwright", "자동화"]
summary: "오늘 뽑아두면 다음 라인업을 볼 수 없다. 페이지가 목록 API 를 부르기 전에 스스로 /apply/ 로 떠나기 때문이다"
---

## 무슨 일이

[[브랜드뽑기]] 의 그날 라인업을 14시 전에 알고 싶었다. 그런데 페이지를 열면
당첨 화면(`/npay/branddraw/apply/`)으로 튕기고 브랜드 목록이 없다.

```
PATH: /npay/branddraw/apply/
STATE: {"waiting": false, "brands": [], "open_time": "22:33:14"}
```

## 원인

페이지 인라인 스크립트를 읽으면 순서가 분명하다.

```js
INIT.ajax({method:'GET', url: ".../internal/branddraw/renewal/apply"})
  .then(({code, data}) => {
      if (code === "success") { location.replace("/npay/branddraw/winner/"); return; }
      if (code === "apply")   { location.replace("/npay/branddraw/apply/");  return; }
      getBrandDraw();                       // ← 목록 API 는 여기서야 호출된다
  })
```

참여 상태가 `apply` 면 **목록 API(`/internal/branddraw/renewal`) 를 부르기 전에**
화면이 떠난다. 그리고 그 상태는 `eventEndDate` 기준 **익일 14시까지** 유효하다.
즉 오늘 뽑아두면 다음 라인업을 볼 수 있는 창이 닫힌다.

반대로 라인업 자체는 오픈 전에도 숨겨져 있지 않다. `getBrandDraw()` 는
`setOpenBrandList()` 를 **먼저** 호출하고, 서버 플래그 `startTodayEvent` 가 false 일 때만
잠금 클래스를 붙인다.

```js
setOpenBrandList(data.openBrandList);       // 항상 그린다
if (data.startTodayEvent) { $('.brand_list').removeClass('wait'); setBrandApply(); }
else                      { $('.brand_list').addClass('wait');    startTimer(); }
```

## 재현

리다이렉트는 **클라이언트가 스스로** 하는 것이다. 그 GET 의 응답 사본만 되돌리면
페이지가 목록을 가져온다 — 서버에 없는 요청을 만들지 않고, 카드도 누르지 않는다.

```python
def unredirect(route, request):
    if request.method != "GET" or not request.url.split("?")[0].endswith("/renewal/apply"):
        route.continue_(); return
    route.fulfill(status=200, content_type="application/json",
                  body=json.dumps({"code": "not_apply"}))

page.route(lambda u: "/internal/branddraw/renewal/apply" in u
           and "/apply/status" not in u, unredirect)
```

`route.fetch()` 로 원본을 먼저 읽으려 하면 `Target page... has been closed` 가 난다.
리다이렉트가 걸린 페이지는 응답 본문을 읽기 전에 떠나버린다. 그래서 참여 상태는
**착지한 경로**(`/apply/` · `/winner/`)로 판정하고, 목록은 두 번째 로드에서 읽는다.

## 그래서

- 이렇게 열어보니 14시 이벤트가 끝난 뒤의 `openBrandList` 는 **빈 배열**이었다
  (화면은 '쉬는 날' `.sec_day_off`). 다음날 라인업은 그 시점에 아직 서버에 없다.
- 그 목록이 채워지는 시각은 공개 정보가 없다. 커뮤니티 글도 "14시 오픈" 만 반복한다.
  그래서 22~02시를 한 시간 간격으로 훑어 재기로 했다.
- 이벤트의 하루는 자정이 아니라 **14시→14시** 다. `eventStartDate` 는 항상 다음 14시고,
  당첨 유효기간도 익일 14시다.

## 한 줄

화면에 없는 데이터가 서버에도 없는 것은 아니다. 없는 건 그 요청을 할 기회다.
