---
title: "Playwright"
date: 2026-09-08T13:00:00+09:00
draft: false
tags: ["브라우저", "자동화", "테스트"]
summary: "Microsoft의 브라우저 자동화 라이브러리. Chromium·Firefox·WebKit을 하나의 API로 조작한다."
altnames: ["playwright-python", "@playwright/test"]
---

Microsoft가 만든 브라우저 자동화 라이브러리. Chromium·Firefox·WebKit을 같은 API로 띄우고 조작한다. Node.js가 본가이며 Python·Java·.NET 바인딩이 있다. E2E 테스트와 스크래핑·업무 자동화에 쓴다.

## 구조

- **Browser → BrowserContext → Page** 계층. 컨텍스트는 쿠키·스토리지가 분리된 독립 세션이라, 브라우저 하나에서 여러 계정을 동시에 돌릴 수 있다.
- **Locator** 는 요소를 가리키는 지연 평가 참조다. 클릭·입력 전에 요소가 나타나고 보이고 안정될 때까지 **자동 대기(auto-wait)** 한다. 명시적 sleep이 거의 필요 없다.
- `storageState` 로 로그인 세션을 파일로 저장하고 재사용한다. 매번 로그인하지 않아도 된다.
- 브라우저 바이너리는 별도로 설치한다(`playwright install chromium`). 시스템 Chrome을 쓰려면 `channel="chrome"`.

## 알아둘 것

- **`visible` 판정은 CSS 기준이다.** `display:none`, `visibility:hidden`, 크기 0인 요소는 보이지 않는 것으로 친다. 하지만 `<template>` 안에 있거나 화면 밖에 렌더된 요소, 아직 데이터가 안 채워진 자리표시자는 판정이 의도와 다를 수 있다. `count()` 로 요소 수를 세는 것과 `is_visible()` 은 다른 질문이다.
- 스크래핑 대상은 [[bot-detection|봇 감지]] 를 한다. 헤드리스 기본값은 [[user-agent]] 와 `navigator.webdriver` 로 쉽게 드러난다. 헤드풀 + 실제 프로필이 더 오래 산다.
- 자동 대기가 있어도 **SPA의 상태 전환** 은 기다려주지 않는다. "요소가 보인다"와 "데이터가 로드됐다"는 다르므로, 확정 조건(특정 텍스트·네트워크 응답)을 기준으로 `expect`/`wait_for` 해야 한다.
- 디버깅은 `PWDEBUG=1` 인스펙터, 또는 트레이스(`tracing.start`) 파일을 `playwright show-trace` 로 여는 편이 스크린샷보다 빠르다.
