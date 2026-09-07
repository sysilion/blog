---
title: "글쓰기는 모바일 웹으로 — 데스크톱 UA면 리다이렉트된다"
date: 2026-08-27T16:25:00+09:00
draft: false
tags: ["dcinside", "크롤링", "user-agent"]
summary: "같은 사이트라도 PC 경로와 모바일 경로의 검증 강도가 다르다. 약한 쪽을 쓰되 UA를 맞춰야 한다."
aliases: ["/wiki/dcinside-mobile-ua-required-for-write/"]
---

## 무슨 일이

디시인사이드 글/댓글 작성을 PC 경로(`gall.dcinside.com`)로 구현하려니 검증 단계가 계속 늘어났다.
모바일 웹(`m.dcinside.com`)은 폼 토큰 하나로 끝난다.

그런데 모바일 URL로 요청해도 데스크톱 [[user-agent|User-Agent]]면 **PC 사이트로 리다이렉트**된다.

## 원인

[[user-agent|UA 스니핑]]으로 모바일/PC를 가르는 전형적인 구현이다. 경로가 아니라 UA가 사이트를 정한다.

## 그래서

읽기와 쓰기의 UA를 분리했다.

```go
// 글/댓글 작성은 m.dcinside.com 을 쓰는데, 데스크톱 UA로 접근하면
// www.dcinside.com 으로 리다이렉트되므로 모바일 UA가 반드시 필요하다.
uaMobile = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ..."
```

읽기는 PC 갤러리(정보량이 많다), 쓰기는 모바일(검증이 단순하다). 요청 단위로 UA를 고른다.

부가로 알게 된 것: 사진 첨부는 3단계다. `/ajax/i_filter`(준비) → `upload_img.php`(업로드) →
HTML 블록을 본문에 삽입. **첫 단계를 건너뛰면 업로드는 성공하는데 사진이 글에 안 붙는다.**

## 한 줄

> 같은 서비스의 모바일 경로는 별개의 API다. 대개 더 단순하고, 대신 UA가 자물쇠다.
