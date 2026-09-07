---
title: "PaperMod"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["hugo", "papermod"]
summary: "이 블로그가 쓰는 Hugo 테마. 검색은 Fuse.js + index.json 이다."
altnames: ["hugo-PaperMod"]
---

**PaperMod** 는 [[hugo]] 테마다. 이 블로그가 쓰고 있다.

## 구조

- 검색은 `outputs.home` 에 `JSON` 을 추가해 `index.json` 을 만들고, 클라이언트에서 Fuse.js로 찾는다.
- `params.mainSections` 에 들어간 섹션만 홈 목록에 노출된다.
- `assets/css/extended/*.css` 는 자동으로 번들에 합쳐진다. 테마를 건드리지 않고 스타일을 얹을 때 쓴다.
- `layouts/_partials/extend_post_content.html` 를 프로젝트에 두면 본문 뒤에 블록을 끼울 수 있다.

## 알아둘 것

원본 `layouts/index.json` 이 [[hugo-scratch|.Scratch]] 로 검색 인덱스를 누적한다.
로컬 `hugo server` 에서 검색 결과가 리빌드마다 늘어나는 원인이다. 프로젝트에서 덮어써야 한다.
