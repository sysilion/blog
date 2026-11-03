---
title: "Tailwind CSS"
date: 2026-10-31T00:49:36+09:00
draft: false
tags: ["css", "frontend"]
summary: "클래스 이름 하나가 CSS 규칙 하나가 되는 유틸리티 우선 CSS 프레임워크."
altnames: ["Tailwind", "tailwindcss"]
---

Tailwind CSS 는 `px-4`, `text-sm` 같은 작은 유틸리티 클래스를 마크업에 직접 붙여 스타일을 만드는 CSS 프레임워크다.

## 구조

빌드 도구가 소스 파일을 훑어 클래스처럼 생긴 문자열을 모으고, 그중 Tailwind 가 아는 이름만 CSS 로 뽑는다.
쓰지 않은 클래스는 결과물에 들어가지 않는다.

v4 부터는 설정을 JS 파일이 아닌 CSS 안에서 한다.

- `@theme`: 색, 폰트, 애니메이션 같은 디자인 토큰. `--color-brand-600` 을 정의하면 `bg-brand-600` 이 생긴다.
- `@utility`: 새 유틸리티 클래스 정의.
- `@custom-variant`: `dark:` 같은 변형 정의. 클래스 기반 다크 모드는 `@custom-variant dark (&:where(.dark, .dark *));` 로 켠다.
- 중요도 표시는 v4 에서 뒤에 붙인다 (`bg-white!`). 앞에 붙이는 `!bg-white` 는 하위 호환으로만 남아 있다.

## 알아둘 것

모르는 클래스 이름은 경고 없이 버린다. 플러그인이 만들던 클래스(`animate-in` 등)를 플러그인 없이 쓰면 아무 일도 일어나지 않는다.
동적으로 이어 붙인 이름(`` `bg-${color}-500` ``)도 소스에 온전한 문자열로 없으면 생성되지 않는다.
