---
title: "curl_cffi 는 impersonate 를 빼면 브라우저 지문을 내지 않는다"
date: 2026-10-22T09:49:46+09:00
draft: false
tags: ["크롤링", "python", "cloudflare"]
summary: "import 만 바꾸고 impersonate 를 안 주면 arca.live 는 여전히 403. JA3도 크롬과 다르다."
---

## 무슨 일이

arca.live 수집기([[arca-cloudflare-curl-cffi|앞 노트]])를 다시 확인하다가 `impersonate` 인자를 뺀 호출을 돌려 봤다.
크롬 User-Agent 를 넣었는데도 403이 왔다. 인자를 `chrome` 으로 주면 200이다.

## 원인

[[curl-cffi|curl_cffi]] 는 `impersonate` 를 받아야 브라우저의 ClientHello 를 만든다.
인자가 없으면 curl-impersonate 의 기본 설정으로 핸드셰이크하고, 이 [[tls-fingerprinting|TLS 지문]]은 크롬과도, 시스템 `curl` 과도 다르다.
`from curl_cffi import requests` 로 import 만 갈아 끼우면 코드는 그대로 돌지만 차단은 그대로다.

## 재현

curl_cffi 0.16.3, 2026-10-22 기준.

```bash
pip install curl_cffi
python - <<'EOF'
from curl_cffi import requests as r
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36"
u = "https://arca.live/b/genshin"
print(r.get(u, headers={"User-Agent": UA}).status_code)   # 403
print(r.get(u, impersonate="chrome").status_code)          # 200

j = "https://tls.browserleaks.com/json"
print(r.get(j).json()["ja4"])                       # t13d2712h2_b4f9224df7c1_cbb9361b6bf9
print(r.get(j, impersonate="chrome").json()["ja4"]) # t13d1516h2_8daaf6152771_806a8c22fdea
EOF
```

같은 엔드포인트에서 시스템 `curl` 은 `t13d4907h2_…`, `requests` 는 `t13d1712h1_…` 이 나왔다. 네 가지가 전부 다르다.
`impersonate` 값은 `chrome99`, `safari`, `firefox` 로 바꿔도 arca.live 는 200이었다. 크롬이어서 통과한 게 아니고, 실제 브라우저 지문이면 어느 것이든 통과한다.

## 그래서

`subculture-timeline/scripts/parsers/codes/arca.py` 는 `impersonate="chrome"` 을 넘기고 있어서 고칠 것은 없었다.
curl_cffi 로 옮길 때는 호출마다 인자를 넣거나 `Session(impersonate="chrome")` 으로 세션에 박아 둔다.

## 한 줄

curl_cffi 로 바꿨는데도 403이면 `impersonate` 인자가 빠졌는지부터 본다.
