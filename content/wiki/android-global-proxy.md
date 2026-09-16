---
title: "안드로이드 전역 프록시"
date: 2026-09-16T13:18:00+09:00
draft: false
tags: ["android", "proxy", "network"]
summary: "기기의 모든 앱 트래픽에 걸리는 시스템 프록시. 설정은 세 개의 키에 전개되어 저장된다"
altnames: ["global_http_proxy", "global_http_proxy_host", "http_proxy"]
---

안드로이드가 기기 전체에 적용하는 HTTP 프록시다. 특정 앱이 아니라 **모든 앱**의
트래픽이 여기를 지난다.

## 구조

`settings put global http_proxy <host>:<port>` 는 입력용 키다. 시스템은 이걸 받아
**세 개의 키로 전개해** 저장하고, `ConnectivityService` 가 실제로 읽는 것은 전개된
쪽이다.

| 키 | 값 |
| --- | --- |
| `global_http_proxy_host` | 호스트 |
| `global_http_proxy_port` | 포트 |
| `global_http_proxy_exclusion_list` | 예외 목록 |

해제하면 레거시 `http_proxy` 에는 빈 값이 아니라 **`:0`** 이 남는다. 호스트가 없고
포트가 0 인 것, 즉 프록시 없음을 뜻한다.

## 알아둘 것

- **`http_proxy` 만 지우는 것은 해제가 아니다.** 전개된 세 키가 남아 있으면 프록시는
  계속 걸려 있고, 그 프록시가 죽어 있으면 기기의 앱 네트워크가 통째로 막힌다.
  재부팅·네트워크 초기화로도 풀리지 않는다.
- **Wi-Fi 설정 화면의 프록시와 다르다.** 전역 프록시는 그 화면에 나타나지 않아서
  거기서 찾으면 영영 못 찾는다.
- `adb shell` 은 uid 0 으로 돌아 이 프록시를 타지 않는다. `curl`·`ping` 이 되는 것은
  앱이 된다는 증거가 아니다. → [[adb]]
