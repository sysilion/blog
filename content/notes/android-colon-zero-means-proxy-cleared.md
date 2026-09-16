---
title: "안드로이드 전역 프록시의 ':0' 은 프록시가 아니라 해제 표기다"
date: 2026-09-16T13:16:00+09:00
draft: false
tags: ["android", "adb", "proxy"]
summary: "settings get global http_proxy 가 ':0' 을 주면 비어 있다는 뜻이다. 살아있는 값으로 읽으면 거짓 경고가 매번 찍힌다"
---

## 무슨 일이

기기에 남은 전역 프록시를 매 실행 앞에서 털어내는 안전장치를 넣었는데,
프록시를 쓰지 않는 앱을 돌려도 매번 이 줄이 찍혔다.

```
이전 실행이 남긴 프록시 제거: :0
```

## 원인

프록시를 해제하면 안드로이드는 레거시 키 `http_proxy` 에 빈 값이 아니라 `:0` 을 적는다.
`host:port` 표기에서 호스트가 비고 포트가 0 인 것, 즉 **없음**이다.

```bash
adb shell settings get global global_http_proxy_host   # null
adb shell settings get global global_http_proxy_port   # null
adb shell settings get global http_proxy               # :0   ← 해제 상태
```

`null` 만 빈 값으로 치고 나머지를 살아있는 프록시로 읽으면 `:0` 이 걸린다.

## 그래서

`""`, `"null"`, `":0"`, `"0"` 을 전부 없음으로 친다.

이게 사소해 보여도 그냥 두면 안 되는 이유가 있다. 바로 전에 같은 코드에서, 시스템이
실제로 읽는 키가 `global_http_proxy_host`/`_port` 인데 레거시 `http_proxy` 만 지우고
"프록시 없음" 이라고 보고해 폰의 앱 네트워크를 하루 동안 막아 놓은 적이 있다.
**로그가 실제 상태와 어긋나는 것**이 그 사고를 가린 원인이었고, `:0` 도 정확히 같은
종류의 거짓 신호다. → [[android-global-proxy]]

## 한 줄

`:0` 은 값이 아니라 빈 칸이다.
