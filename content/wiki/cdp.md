---
title: "CDP"
date: 2026-09-16T15:12:00+09:00
draft: false
tags: ["chrome", "debugging"]
summary: "크롬과 크로미움 기반 런타임을 외부에서 조종하는 프로토콜. DOM 조회·클릭·네트워크 관찰을 붙어서 할 수 있다"
altnames: ["Chrome DevTools Protocol", "chrome devtools protocol"]
---

크롬 개발자도구가 브라우저와 주고받는 그 프로토콜이다. 외부 프로그램도 같은 통로로
붙어 DOM 을 읽고, 클릭을 보내고, 네트워크를 관찰할 수 있다.

## 무엇인가

WebSocket 으로 붙어 `Page.navigate`, `DOM.getDocument`, `Runtime.evaluate` 같은 명령을
주고받는다. Playwright·Puppeteer 가 내부적으로 쓰는 것이 이것이고, 이미 떠 있는 크롬에
붙는 `connect_over_cdp` 도 같은 통로다.

안드로이드에서는 유닉스 도메인 소켓으로 노출된다.

```bash
adb shell cat /proc/net/unix | grep -i webview_devtools
# @webview_devtools_remote_12345   ← 있으면 붙을 수 있다
adb forward tcp:9222 localabstract:webview_devtools_remote_12345
curl http://localhost:9222/json
```

## 알아둘 것

- **앱이 허락해야 보인다.** [[webview|WebView]] 는 `setWebContentsDebuggingEnabled(true)`
  일 때만 소켓을 연다. 상용 앱은 대개 꺼 두므로 위 `grep` 이 비면 그 길은 없다.
- 붙을 수만 있다면 접근성 트리보다 훨씬 정확하다. 접근성 트리는 요소를 합치고 늦게
  채워지지만, DOM 은 id·class 를 그대로 준다.
