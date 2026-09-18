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

## 재현 — 쿠키를 주지 않으면 된다

리다이렉트는 참여 상태 때문에 일어난다. 그러니 **참여 상태가 없는 세션**으로 열면 된다.
같은 API 가 `{"code": "not_login"}` 을 주고, 페이지는 목록 API 로 넘어간다.

```python
cfg.browser.profile_dir = "./profile_anon"
shutil.rmtree(BASE / "profile_anon", ignore_errors=True)   # 매번 빈 프로필
# 쿠키 주입 없음
page.goto("https://campaign2.naver.com/npay/branddraw/?from=pointtab")
```

```
brands: 올리브영(마감) · 오늘의집(마감) · 컬리(마감) · 알라딘(마감)
API 200 /internal/branddraw/renewal/apply {"code": "not_login"}
startTodayEvent: true | eventStartDate: 2026-09-18T14:00:00
```

계정을 쓰지 않으니 참여 이력·탐지 표면과 아예 무관하다. 라인업은 어차피 계정별 정보가
아니다.

## 가로채기로 막으려던 시도는 실패했다

먼저 `page.route` 로 그 GET 의 응답을 `not_apply` 로 바꿔치려 했다. 세 군데서 막혔다.

**1. `page.route` 의 정규식은 fullmatch 다.** URL 일부만 적은 패턴은 한 번도 걸리지 않고,
조용히 통과한다. 핸들러 호출 횟수를 세어보기 전까지는 "안 걸렸다" 는 걸 알 수 없다.

```python
page.route(re.compile(r"/internal/branddraw/renewal/apply"), h)        # 안 걸린다
page.route(re.compile(r".*/internal/branddraw/renewal/apply.*"), h)    # 걸린다
```

글로브도 같다. `**/npay/branddraw/apply/**` 는 `?t=...` 가 붙은 URL 에 맞지 않았다.

**2. 교차 출처라 CORS 헤더가 필요하다.** 페이지는 `campaign2.naver.com`, API 는
`mkt-api.naver.com` 이다. `route.fulfill()` 로 만든 응답에
`access-control-allow-origin`·`access-control-allow-credentials` 를 붙이지 않으면
브라우저가 버린다.

**3. 전부 가로채면 API 호출 자체가 사라진다.** `ctx.route("**/*")` 로 걸고 그냥
`route.continue_()` 만 해도 프리플라이트가 깨져 `/internal/…` 요청이 아예 나가지 않았다.
13건의 정적 자원만 오가고 XHR 은 없었다.

```
route hits: {'all': 13, 'apply': 0}
--- responses containing internal/ ---      ← 비어 있다
```

`route.fetch()` 로 원본을 먼저 읽으려는 것도 안 된다 — 리다이렉트가 걸린 페이지는
응답 본문을 읽기 전에 떠나며 `Target page... has been closed` 를 낸다.

## 그래서

- 14시 이벤트가 끝난 뒤의 `openBrandList` 는 비어 있지 않다. **로그인 상태에서 비어
  보였던 것**이고, 비로그인으로 읽으면 그날 라인업이 마감 표시와 함께 그대로 나온다.
- 이벤트의 하루는 자정이 아니라 **14시→14시** 다. `eventStartDate` 는 오픈 후에는 그날
  14:00, 오픈 전에는 다음 14:00 을 가리킨다.
- 라인업이 언제 새로 올라오는지는 여전히 측정 대상이다. 비로그인 프로브를
  22·23·00·01·02·06·09:30·12:30·13:50 에 돌려 첫 관측 시각을 적게 해뒀다.

## 한 줄

로그인은 정보를 더 주는 게 아니라, 이 페이지에서는 **정보를 가린다.**
