---
title: "Hugo"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["hugo", "정적사이트"]
summary: "Go 템플릿 기반 정적 사이트 생성기. 이 블로그가 쓰는 도구."
altnames: ["gohugo"]
---

**Hugo** 는 Go로 만든 정적 사이트 생성기다. 마크다운 콘텐츠와 Go 템플릿을 조합해 HTML을 뽑는다.
이 블로그는 Hugo + [[papermod]] 로 만들어져 있다.

## 알아둘 것

- 마크다운 렌더러는 **goldmark** 다. `[[위키링크]]` 같은 확장 문법은 기본 지원하지 않는다.
- 템플릿 파티셜은 `return` 으로 값을 돌려줄 수 있지만 **파티셜 하나에 `return` 은 하나만** 둘 수 있다.
- 누적이 필요하면 [[hugo-scratch|.Scratch]] 대신 `$x = $x | append` 를 쓴다.
- `buildFuture: false` 이면 미래 날짜의 콘텐츠는 빌드되지 않는다. 새 문서가 안 보이면 여기를 먼저 본다.
