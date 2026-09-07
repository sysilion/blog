---
title: "위키 API도 데이터센터 IP를 막는다 — bluearchive.wiki 403"
date: 2026-09-07T15:30:00+09:00
draft: false
tags: ["mediawiki", "github-actions", "크롤링", "python"]
summary: "HTML 스크래핑만 차단된다고 생각해 API 경로에는 프록시를 안 걸어뒀다. GitHub Actions에서만 403이 온다."
aliases: ["/wiki/mediawiki-api-blocks-datacenter-ip/"]
---

## 무슨 일이

`subculture-timeline`의 일정 동기화 워크플로가 이틀 연속 실패했다. 10개 게임 중 블루 아카이브
하나만 깨진다.

```text
[bluearchive] 배너 파싱 실패: 403 Client Error: Forbidden for url:
  https://bluearchive.wiki/w/api.php?action=cargoquery&tables=banners&...
[bluearchive] 이벤트 파싱 실패: 403 ...
⚠ 파싱 실패/무수확 (1/10): bluearchive
```

로컬에서 같은 URL을 그대로 부르면 200이다.

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  'https://bluearchive.wiki/w/api.php?action=cargoquery&tables=banners&fields=NameEN&limit=5&format=json'
# 200
```

UA를 바꿔도, 헤더를 브라우저와 똑같이 맞춰도 로컬은 계속 200. 즉 **헤더가 아니라 IP** 문제다.
[[github-actions|GitHub Actions]] 러너의 Azure 대역이 막혀 있다.

## 원인

파서 공통 유틸에 이미 프록시 통로가 있었다. [[datacenter-ip]]를 막는 사이트(wuwatracker,
nikke.gg)를 위해 `SYNC_PROXY`를 두고 `fetch()`에서 쓰고 있었다.

문제는 **위키 API 경로가 그 통로를 안 탔다는 것**이다. 코드 주석에 의도가 그대로 남아 있었다.

```python
# ── MediaWiki 위키 소스 공통 유틸 ──
# HTML 스크래핑과 달리 위키 API는 CI 환경에서도 차단되지 않아 안정적이다.   # ← 틀린 전제

def cargo_query(api, tables, fields, ...):
    r = requests.get(api, headers=BROWSER_HEADERS, timeout=20, params=params)
    #                                                          ^ proxies 없음
```

"차단은 HTML 스크래핑 얘기고 공식 API는 열려 있다"는 전제가 깔려 있었는데, [[mediawiki|위키]]가 Cloudflare
뒤로 들어가면 `/w/api.php`도 똑같이 IP 기준으로 걸린다. 엣지 레이어는 그게 API 엔드포인트인지
신경 쓰지 않는다.

## 그래서

`fetch()`와 같은 통로를 쓰게 한다.

```python
r = requests.get(api, headers=BROWSER_HEADERS, timeout=20, params=params,
                 proxies=proxies())
```

`proxies()`는 `SYNC_PROXY`가 없으면 `None`을 주므로 로컬 실행은 그대로 직결이다.

한 가지 더. 실패한 워크플로의 로그를 끝까지 읽으면 커밋과 배포는 **이미 끝난 뒤**였다.

```text
dca32e8..dfe1835  main -> main
https://github.com/.../actions/runs/34005703495   ← deploy 트리거됨
##[error]파싱 실패/무수확 1개: bluearchive          ← 그 다음에 exit 1
```

파싱 결과 판정이 커밋·배포 스텝보다 뒤에 있어서, 9개 게임 데이터는 정상 반영되고 CI 상태만
빨간색이었다. 부분 실패를 알리는 신호로는 맞게 동작한 셈이지만, "실패했으니 데이터도 안 올라갔겠지"
하고 넘기면 오진한다.

## 한 줄

> 공식 API라고 차단 예외가 아니다. IP로 막는 엣지 앞에서 `/w/api.php`는 그냥 또 하나의 URL이다.
