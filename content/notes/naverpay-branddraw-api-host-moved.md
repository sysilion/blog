---
title: "네이버페이 브랜드뽑기 API가 경로 접두사째 다른 호스트로 옮겨 갔다"
date: 2026-11-12T09:55:20+09:00
draft: false
tags: ["playwright", "naverpay", "자동화"]
summary: "/internal/branddraw 만 엿듣던 코드가 campaign2-api 응답을 놓쳐 마감 응답도 금액도 못 읽었다"
---

## 무슨 일이

브랜드뽑기 자동 응모는 성공했는데 결과 리포트의 `status_raw` 가 비어 있었다. 마감 응답도 못 받아서, 전부 마감되면 보너스 뽑기를 기다리는 분기가 한 번도 돌지 않았다. 응모 자체는 페이지 이동으로 판정하고 있어서 겉보기엔 정상이었다.

## 원인

페이지가 부르는 [[undocumented-api|비공개 API]]가 `mkt-api.naver.com/internal/branddraw/...` 에서 `campaign2-api.naver.com/branddraw/...` 로 바뀌었다. 호스트만 바뀐 게 아니라 `/internal` 접두사도 빠졌다. [[playwright]] 응답 리스너가 `"/internal/branddraw/" in url` 로 거르고 있어서 새 응답이 전부 걸러졌다.

옛 주소도 아직 호출은 된다. 다만 `renewal/apply` 응답 본문이 `null` 이라 아무 정보가 없다.

## 재현

```python
page.on("response", lambda r: "branddraw" in r.url
        and r.request.resource_type in ("xhr", "fetch")
        and print(r.url))
page.goto("https://mkt-npay.naver.com/npay/branddraw/")
# mkt-api.../internal/branddraw/renewal/apply        → null
# campaign2-api.../branddraw/renewal/apply/status    → {"code":"success","data":{...}}
```

`apply/status` 의 `data` 에 `point` 와 `multipleOne/Three/Six` 가 있다. 결과 화면의 1만·3만·6만원 구간 적립액은 `point × 배수` 를 10원 단위로 반올림한 값이다 (3110 → 3,110 / 4,350 / 8,710). 화면 글자는 숫자 한 자마다 요소가 갈려 `innerText` 로는 줄이 끊긴다.

## 그래서

URL 필터를 경로 꼬리(`/branddraw/renewal/apply/status`)와 호스트 목록으로 바꿨다. 금액은 화면을 긁지 않고 status 필드로 계산한다.

## 한 줄

응답 리스너 결과가 비면 먼저 필터 없이 xhr/fetch URL을 전부 찍어 본다. 접두사로 거르지 말고 경로 꼬리로 거른다.
