---
title: "http_proxy 를 지웠는데 프록시가 안 풀려 폰 인터넷을 하루 막아 놨다"
date: 2026-09-16T13:20:00+09:00
draft: false
tags: ["android", "adb", "proxy"]
summary: "settings put global http_proxy 는 세 개의 키로 전개된다. 시스템이 읽는 건 전개된 쪽이고, 레거시 키만 지우면 프록시는 그대로 남는다"
---

## 무슨 일이

접근이 막힌 API 를 앱에서 쓰려고 [[android-global-proxy|전역 프록시]]를 잠깐 걸었다가
끝나고 지웠다.

```bash
adb shell settings put global http_proxy 192.168.0.10:8118   # 걸고
adb shell settings delete global http_proxy                  # 지우고
adb shell settings get global http_proxy                     # null — 없다
```

`null` 을 확인하고 "프록시 없음" 이라고 세 번 보고했다. 그런데 폰에서는 그날부터
**어떤 앱도 인터넷이 안 됐다.** 재부팅해도, 네트워크를 초기화해도 그대로였다.

## 원인

`http_proxy` 는 **입력용 키**다. 시스템이 이 값을 받아 세 개의 키로 전개해 저장하고,
`ConnectivityService` 가 실제로 읽는 것은 전개된 쪽이다.

```bash
adb shell settings get global global_http_proxy_host   # 192.168.0.10  ← 살아 있었다
adb shell settings get global global_http_proxy_port   # 8118
adb shell settings get global global_http_proxy_exclusion_list
```

레거시 키만 지웠으니 프록시는 그대로였고, 프록시 서버(호스트에서 돌던 브리지)는
이미 죽어 있었다. 모든 앱이 죽은 프록시로 나가려다 막힌 것이다. 설정에 저장된 값이라
재부팅으로 안 풀리고, Wi-Fi 설정 화면에는 전역 프록시가 **표시되지 않아** 거기서
찾으면 영영 못 찾는다.

## 진단을 더 늦춘 것

`adb shell` 에서 `curl`·`ping` 이 200 을 받는 걸 보고 "네트워크는 멀쩡하다" 고 판단했다.
`adb shell` 은 uid 0 으로 돌아 앱의 네트워크 경로를 타지 않는다. **앱 연결의 증거가
아니다.** 이걸 증거로 쓰는 바람에 원인을 Wi-Fi 설정, [[tailscale|Tailscale]] exit node,
Knox 쪽으로 계속 잘못 밀었다.

## 재현

```bash
adb shell settings put global http_proxy 10.0.0.1:9999
adb shell settings get global global_http_proxy_host    # 10.0.0.1  ← 전개됐다
adb shell settings delete global http_proxy
adb shell settings get global global_http_proxy_host    # 10.0.0.1  ← 그대로 남아 있다
```

## 그래서

지울 때는 전개된 키를 전부 지운다.

```bash
for k in global_http_proxy_host global_http_proxy_port \
         global_http_proxy_exclusion_list http_proxy; do
  adb shell settings delete global $k
done
```

확인도 전개된 키로 한다. 그리고 해제 상태의 `http_proxy` 는 `null` 이 아니라 `:0` 일
수 있다 — 그걸 살아있는 값으로 읽으면 이번엔 반대 방향의 거짓 신호가 된다.
→ [[android-global-proxy]]

## 한 줄

설정이 받은 키와 시스템이 읽는 키가 다를 수 있다. 확인은 **읽는 쪽**에서 한다.
