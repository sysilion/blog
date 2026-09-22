---
title: "Fandom MediaWiki API가 같은 UA인데 curl엔 200, requests엔 403"
date: 2026-09-22T18:08:12+09:00
draft: false
tags: ["크롤링", "python", "mediawiki"]
summary: "헤더를 아무리 맞춰도 파이썬 requests만 403 — 차단 기준이 헤더가 아니라 TLS 핸드셰이크였다"
---

## 무슨 일이

서브컬쳐 게임 리딤 코드 소스를 찾다가 [[mediawiki|MediaWiki]] API를 쓰는 Fandom 위키들을 후보에 올렸다.
`curl` 로 확인할 때는 멀쩡히 JSON이 오는데, 같은 URL을 파이썬 `requests` 로 부르면
전부 `JSONDecodeError` 로 죽었다. 받은 본문은 JSON이 아니라 HTML 차단 페이지였다.

## 원인

[[tls-fingerprinting|TLS 지문]]. 헤더가 아니라 핸드셰이크 모양을 보고 막는다.
프로젝트의 `BROWSER_HEADERS`(브라우저와 동일한 UA·Accept·Sec-Fetch-* 세트)를 그대로 보내도 결과가 같았다.
User-Agent를 `curl` 과 **완전히 동일한 문자열**로 맞춘 뒤에도 갈렸다.

## 재현

```bash
U="https://genshin-impact.fandom.com/api.php?action=query&list=search&srsearch=promotional+code&format=json"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

curl -s -o /dev/null -w "%{http_code}\n" -A "$UA" "$U"          # 200
python3 -c "
import requests
print(requests.get('$U', headers={'User-Agent': '''$UA'''}, timeout=20).status_code)"   # 403
```

`requests` 쪽 응답은 `content-type: text/html` 에 Cloudflare 차단 페이지다.
상태 코드를 보기 전에 `r.json()` 을 부르면 [[bot-detection|차단]]이 파싱 오류로 둔갑해,
원인이 네트워크가 아니라 코드에 있는 것처럼 보인다.

## 그래서

Fandom은 후보에서 뺐다. 게임별 리딤 코드는 `pockettactics.com` 의 `/<게임>/codes` 페이지와
`hoyo-codes.seria.moe` API로 모으고 있다. 둘 다 `requests` 에 정상 응답한다.

같은 증상을 다시 만나면 순서는 이렇다 — ① 헤더를 다 맞춰 본다 → ② `curl` 과 결과가 갈리는지 본다 →
③ 갈리면 헤더를 더 만지지 말고 TLS 스택을 바꾸거나(`curl_cffi`) 소스를 바꾼다.

## 한 줄

헤더를 다 맞췄는데 `curl` 만 되면, 남은 변수는 TLS 스택이다.
