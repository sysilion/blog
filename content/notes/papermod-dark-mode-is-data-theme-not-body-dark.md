---
title: "PaperMod 다크 모드에서 .dark 로 쓴 CSS가 한 번도 안 먹었다"
date: 2026-10-19T17:42:28+09:00
draft: false
tags: ["hugo", "papermod", "css"]
summary: "지금 PaperMod 는 다크 모드를 body.dark 가 아니라 html[data-theme=dark] 로 켠다. .dark 선택자는 경고 없이 죽은 규칙이 된다."
---

## 무슨 일이

위키의 빨간 링크(`.wl-missing`)는 다크 모드용 색을 따로 정의해 두었는데, 다크 모드에서도 라이트 색 `#c0392b` 로 나왔다.
어두운 배경 위 대비 3.07:1.

## 원인

`assets/css/extended/wiki.css` 의 다크 규칙이 전부 `.dark ...` 로 시작했다. 예전 [[papermod]] 는 `<body class="dark">` 를 썼지만
지금 테마는 `<html>` 의 `data-theme` 속성으로 켠다. `.dark` 를 가진 요소가 없으니 규칙은 아무것에도 걸리지 않는다.
CSS는 매칭 안 되는 선택자에 대해 아무 말도 하지 않는다.

## 재현

```bash
grep -n 'dataset.theme' themes/PaperMod/layouts/_partials/head.html
# 147:        document.querySelector("html").dataset.theme = 'dark';
grep -n 'data-theme="dark"' themes/PaperMod/assets/css/core/theme-vars.css
```

수정 전 빌드를 다크 모드로 열고 `getComputedStyle(document.querySelector('.wl-missing')).color` → `rgb(192, 57, 43)` (라이트 색).

## 그래서

다크 규칙의 선택자를 `[data-theme="dark"] ...` 로 바꿨다. 빨간 링크 대비 3.07 → 6.59:1.
JS가 꺼져 있으면 `data-theme` 이 `auto` 로 남아 여전히 라이트 색이다. 테마 쪽 한계라 그대로 두었다.

## 한 줄

> 테마 위에 다크 모드 CSS를 얹기 전에 테마의 다크 모드 스위치가 어떤 요소의 어떤 속성을 바꾸는지 grep 해 본다.
