---
title: "종료 시각을 날짜로 자르면 초기화 전 새벽 마감이 하루 늦게 표시된다"
date: 2026-10-28T02:33:42+09:00
draft: false
tags: ["subculture-timeline", "datetime", "javascript"]
summary: "원신 이벤트는 KST 04:59:59에 끝나는데, 날짜만 저장하면 그날 하루를 통째로 진행 중으로 센다."
---

## 무슨 일이

서브컬쳐 타임라인에 이벤트 종료 카운트다운을 넣었다. 데이터에는 종료일(`end: "2026-11-02"`)만 있어서
"종료일 당일까지 진행, 다음 날 게임의 [[일일 초기화]] 시각에 끝"으로 계산했다.
그런데 파서가 받는 원본(api.ennead.cc)에는 unix 초 단위 종료 시각이 있었고, 원신 이벤트 대부분은
`2026-11-02T04:59:59+09:00` 에 끝났다. 원신의 하루는 KST 05시에 바뀌므로 이 이벤트는 11/2 게임일이
시작되기 1초 전에 끝난다. 화면은 11/3 05:00까지 남았다고 보여줬다. 실제보다 24시간이 길다.

## 원인

파서가 종료 시각을 KST 날짜로만 잘라 저장했다(`strftime("%Y-%m-%d")`).
날짜만 남으면 "그날 새벽에 끝났는지, 그날 밤에 끝나는지"가 사라진다.
배너는 15:59:59에 끝나서 하루 이내로 어긋나고, 초기화 직전에 끝나는 이벤트·도전 콘텐츠는 하루를 통째로 더 센다.

## 재현

```python
from datetime import datetime, timezone, timedelta
KST = timezone(timedelta(hours=9))
end = datetime(2026, 11, 2, 4, 59, 59, tzinfo=KST)   # 실제 마감
day = end.date()                                      # 저장된 값: 2026-11-02
reset = 5                                             # 원신 초기화 05시
guessed = datetime(day.year, day.month, day.day, reset, tzinfo=KST) + timedelta(days=1)
print(guessed - end)                                  # 1 day, 0:00:01
```

## 그래서

파서가 날짜와 별도로 `endAt`(ISO 8601, `+09:00` 포함)을 함께 저장하게 했다.
화면은 `endAt` 이 있으면 그것으로 진행/종료와 카운트다운을 정하고, 없을 때만 초기화 시각으로 추정한다.
명조 쪽(wuwatracker)도 `endDate` 에 시각이 있어서 같은 방식으로 살렸다.

## 한 줄

일정 데이터를 날짜로 줄이기 전에 원본에 시각이 있는지 먼저 보고, 있으면 오프셋을 붙인 채로 따로 남긴다.
