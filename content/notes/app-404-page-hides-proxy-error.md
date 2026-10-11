---
title: "앱의 '페이지를 찾을 수 없습니다' 뒤에 프록시 오류가 숨어 있었다"
date: 2026-10-10T20:18:53+09:00
draft: false
tags: ["android", "adb", "proxy"]
summary: "이마트 앱이 404 안내 화면을 띄웠지만 접근성 트리에는 net::ERR_PROXY_CONNECTION_FAILED 가 있었다. 서버가 아니라 프록시가 죽은 것이었다"
---

## 무슨 일이

이마트 앱 출석체크가 한 주에 세 번 실패했다. 스크린샷은 매번 같았다.

```
죄송합니다
원하시는 페이지를 찾을 수 없습니다
해당 페이지가 삭제 또는 변경되어 사용할 수 없습니다
```

이벤트 페이지가 바뀐 줄 알았다. 그런데 출석 페이지가 아니라 **홈부터** 이 화면이었다.

## 원인

같은 화면의 접근성 트리를 읽으면 안내 문구 위에 [[webview]] 의 오류 화면이 겹쳐 있다.

```
웹페이지를 사용할 수 없음
https://eapp.emart.com/main/main.do 의 웹페이지를 로드할 수 없습니다.
net::ERR_PROXY_CONNECTION_FAILED
죄송합니다\n원하시는 페이지를 찾을 수 없습니다
```

이마트 앱은 가정용 IP 차단을 피하려고 [[android-global-proxy|기기 전역 프록시]]를 걸고 돌린다.
그 프록시가 안 붙고 있었다. 다른 날은 `net::ERR_TIMED_OUT` 이었다. 앱은 웹뷰 로딩이 실패하면
원인과 상관없이 자기 404 안내를 덮어씌우니, 화면만 보면 서버 문제로 보인다.

## 재현

```bash
adb shell uiautomator dump /sdcard/x.xml
adb shell "grep -o 'text=\"net::ERR_[A-Z_]*\"' /sdcard/x.xml"
# text="net::ERR_PROXY_CONNECTION_FAILED"
```

## 그래서

프록시로 시도해 실패했고 화면에 `net::ERR_` 나 `웹페이지를 사용할 수 없음` 이 있으면, 프록시를
끄고 한 번 더 시도한다. 바꾼 뒤 첫 실행에서 프록시 없이 출석이 완료됐다. → `naverpay_click/appcheck.py`

오류 문구를 1초만 기다렸을 때는 재시도가 한 번도 일어나지 않았다. 덤프 한 번에 몇 초가 들어
화면을 읽기도 전에 끝났기 때문이다.

## 한 줄

앱이 보여 주는 오류 화면은 앱이 고른 문구다. 진짜 원인은 그 밑의 웹뷰 오류 코드에 있다.
