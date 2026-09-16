---
title: "WebView는 화면을 다 그린 뒤에 접근성 트리를 만든다 — 그 틈에 뜬 덤프는 빈 껍데기다"
date: 2026-09-16T15:10:00+09:00
draft: false
tags: ["android", "adb", "uiautomator", "webview"]
summary: "uiautomator dump가 화면 전체를 자식 없는 WebView 노드 하나로 돌려준다. '요소가 없다'가 아니라 '아직 안 만들어졌다'다"
---

## 무슨 일이

[[adb]] 로 안드로이드 앱의 출석체크를 자동화하는데, 네 앱 중 셋이 같은 말로 실패했다.

```
결과: 실패
비고: 홈에서 '출석체크' 를 찾지 못함
```

그런데 폰 화면에는 '출석체크' 가 **버젓이 보인다.** 스크린샷을 찍어도 보인다.

## 원인

[[uiautomator]] 덤프를 받아 보면 화면 전체가 노드 하나였다.

```xml
<node bounds="[0,0][1080,2640]" class="android.webkit.WebView"
      resource-id="com.tms:id/mWebView" clickable="true" />
```

**자기닫힘 태그다 — 자식이 하나도 없다.** [[webview|WebView]] 는 렌더링이 끝난 뒤에도
접근성 트리(virtual view hierarchy)를 한 박자 늦게 만든다. 그 사이에 덤프를 뜨면 웹
콘텐츠가 통째로 빠진 껍데기가 나온다.

문제는 이 상태가 **'요소가 없다' 와 구분되지 않는다**는 것이다. 코드는 "버튼이 없네"
라고 판단하고, 스크롤을 더 하다가 엉뚱한 배너를 누르고, 결국 실패로 끝난다.

## 재현

T멤버십 홈 화면 하나를 3초 간격으로 반복해서 떴다.

```bash
adb shell am force-stop com.tms
adb shell monkey -p com.tms -c android.intent.category.LAUNCHER 1
for i in $(seq 5); do
  adb shell "uiautomator dump /sdcard/d.xml >/dev/null; cat /sdcard/d.xml" \
    | grep -c '<node'
  sleep 3
done
```

```
1회차:   48노드,  빈 WebView 1개,  '출석' 0개
2회차:  170노드,  빈 WebView 0개,  '출석' 2개
3회차:  170노드,  빈 WebView 0개,  '출석' 2개
```

한 번만 뜨고 판단하면 20%의 확률로 빈 화면을 본다. 앱을 막 띄운 직후라면 그보다 훨씬 높다.

## 그래서

자기닫힘 WebView 노드를 **'아직 준비 안 됨'의 신호**로 쓴다.

```python
_BARE_WEBVIEW = re.compile(r'<node[^>]*class="android\.webkit\.WebView"[^>]*/>')

def webview_pending(xml: str) -> bool:
    return bool(_BARE_WEBVIEW.search(xml))
```

덤프 함수가 이걸 만나면 다시 뜬다. 다만 **끝내 안 채워지는 화면도 있다** — 진짜로 빈
웹뷰이거나 에러 페이지인 경우다. 그래서 무한정 기다리지 않고, 시도 횟수를 다 쓰면
마지막에 받은 것이라도 돌려준다.

고치고 나니 네 앱이 전부 통과했다. 그 전까지 '스와이프가 탭으로 먹힌다', '사이드
메뉴가 열린다' 로 따로 진단하고 각각 대책을 넣었던 것들도 상당수가 같은 뿌리였다 —
버튼이 없는 줄 알고 스크롤을 더 하다가 배너를 눌렀던 것이다.

## 한 줄

빈 트리는 '없다' 가 아니라 '아직' 일 수 있다. 둘을 구분하지 않으면 멀쩡한 화면을 두고 실패한다.
