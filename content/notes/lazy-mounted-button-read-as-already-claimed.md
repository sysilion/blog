---
title: "스크롤해야 마운트되는 버튼을 '이미 받았다' 로 읽었다 — 매일 10 펫쿠키를 흘렸다"
date: 2026-09-18T16:34:58+09:00
draft: false
tags: ["naverpay", "playwright", "자동화"]
summary: "안내문으로 페이지가 정상 렌더됐는지 판정했는데, 안내문은 스크롤 전에도 DOM 에 있고 버튼만 없었다"
---

## 무슨 일이

페이펫 '오늘의 운세' 는 하루 1회 10 펫쿠키를 준다. 리포트는 매일 이렇게 남았다.

```
2026-09-17_00-20 | 운세: skipped 이미 수령
2026-09-17_15-29 | 운세: skipped 이미 수령
2026-09-18_00-09 | 운세: skipped 이미 수령     ← 0시 초기화 직후인데?
2026-09-18_15-21 | 운세: skipped 이미 수령
```

운세는 **0시에 초기화**된다. 00:09 실행이 '이미 수령' 인 건 말이 안 된다.

## 원인

판정 코드는 이랬다.

```python
btn = page.locator("button:has-text('펫쿠키 받기')").first
if btn.count() == 0:
    body = page.inner_text("body")
    if _FORTUNE_HINT_PAT.search(body):      # "운세 펫쿠키는 하루에 한 번..."
        return ... action="skipped", detail="이미 수령"
```

'버튼이 없다' 만으로는 렌더 실패와 구분이 안 되니 **안내문이 보이면 페이지는 정상**이라고
본 것이다. 그런데 이 페이지는 버튼을 **스크롤해야 마운트**한다. 안내문은 스크롤 전에도
DOM 에 있다 — `inner_text` 는 화면 밖 텍스트도 읽는다.

| 시점 | 버튼 | 안내문 | 문서 높이 |
| --- | --- | --- | --- |
| 로드 직후 3초 | 0개 | 없음 | 844 |
| 로드 후 8초 | 0개 | **있음** | 1889 |
| 맨 아래로 스크롤 | **1개** (`disabled=false`) | 있음 | 1889 |

즉 조건이 정확히 '렌더 도중' 을 가리키고 있었다. 안내문은 왔고 버튼은 아직 없는 상태.

## 재현

```python
page.goto("https://point.pay.naver.com/paypet/fortune?payapptoolbar=false")
time.sleep(8)
print(page.locator("button:has-text('펫쿠키 받기')").count())   # 0
page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
time.sleep(3)
print(page.locator("button:has-text('펫쿠키 받기')").count())   # 1
```

## 그래서

한 화면씩(`innerHeight * 0.9`) 내리며 버튼이 붙는지 보게 했다. 한 번에 끝까지 내리면
지연 렌더가 따라오지 못하는 경우가 있다.

```
16:34:02 [INFO] 오늘의 운세 — 스크롤 후 '펫쿠키 받기' 버튼 발견
16:34:05 [INFO]   ✓ 오늘의 운세 펫쿠키 +10
```

- 펫쿠키 1965 → 1975. 고친 날 바로 받았다.
- 며칠을 흘렸는지는 모른다. 리포트가 남은 9/17 부터만 확인된다.

## 한 줄

**'존재하는 텍스트' 는 '렌더가 끝났다' 의 증거가 아니다.** 화면 밖 DOM 은 이미 와 있다.
