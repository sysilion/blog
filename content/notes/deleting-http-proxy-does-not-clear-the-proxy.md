---
title: "http_proxy 를 지웠는데 프록시가 안 풀려 폰 인터넷을 하루 막아 놨다"
date: 2026-09-16T13:20:00+09:00
draft: false
tags: ["android", "adb", "proxy"]
summary: "행을 지우는 것으로는 안 풀린다. 안드로이드가 쓰는 대로 :0 을 써 넣어야 하고, 확인은 크롬으로만 된다"
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

## 그래서 — 지우는 걸로는 안 된다

전개된 키까지 **전부** 지워도 안 풀린다. 다음날 같은 일을 다시 겪고서야 확인했다.
키 네 개가 모두 `null` 인데 앱은 여전히 막혀 있었다.

```bash
adb shell settings get global global_http_proxy_host   # null
adb shell settings get global global_http_proxy_port   # null
adb shell settings get global http_proxy               # null
# 그런데 크롬은:  ERR_PROXY_CONNECTION_FAILED
```

`ConnectivityService` 는 이미 들고 있는 `ProxyInfo` 를 계속 쓴다. **행을 지우는 것은
값이 바뀐 게 아니라서 알림이 가지 않는다.** 안드로이드가 프록시를 끌 때 빈 값이
아니라 `:0` 을 **써 넣는** 이유가 이것이다.

```bash
adb shell settings put global http_proxy :0
#   global_http_proxy_host → ""   (전개된 키까지 함께 덮인다)
#   global_http_proxy_port → 0
# 크롬: 정상
```

`:0` 하나면 충분하다. 전개된 키를 따로 지울 필요가 없다.

**반영에 8~10초가 걸린다.** 값은 즉시 바뀌지만 트래픽이 따라오는 데 시간이 걸린다.
3초 뒤에 확인했다가 여전히 막혀 있길래 "`:0` 은 관계없다" 고 잘못 결론 내리고
고쳤던 코드를 되돌린 적이 있다. 쓰고 나서는 기다렸다가 확인할 것.

## 확인은 크롬으로만 한다

이 문제를 이틀이나 끈 진짜 이유다. **프록시를 타지 않는 것들로 확인하면 멀쩡해 보인다.**

| 확인 수단 | 죽은 프록시가 걸린 상태에서 |
| --- | --- |
| `adb shell curl` · `ping` | 정상 (uid 0 이라 앱 네트워크 경로가 아니다) |
| 삼성 인터넷 | 정상 |
| 포켓CU 같은 앱 | 정상 |
| **크롬** | **`ERR_PROXY_CONNECTION_FAILED`** |

앞의 셋으로 확인하고 "프록시 탓이 아니다" 라고 결론 내렸었다. 통제 실험까지 했는데
positive control 이 잘못돼서 — 죽은 프록시를 걸어도 그 앱들은 멀쩡히 붙었다 — 오히려
틀린 결론을 확신하게 만들었다. **시스템 프록시를 실제로 타는 것으로 재야 한다.**

## 옛 진단 (전개 키 문제)


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
