---
title: "Compose 캔버스 화면"
date: 2026-10-19T17:50:13+09:00
draft: false
tags: ["android", "accessibility"]
summary: "접근성 노드를 내보내지 않고 직접 그려진 안드로이드 화면. uiautomator 로는 버튼이 보이지 않는다."
altnames: ["compose-canvas", "캔버스 화면"]
---

Compose 캔버스 화면은 버튼·글자를 뷰 계층의 노드로 내보내지 않고 직접 그린 안드로이드 화면이다.

## 무엇인가

- 안드로이드 UI 자동화(`uiautomator dump`, 접근성 서비스)는 뷰 계층이나 Compose 의 semantics 트리를 읽는다.
- 그리는 쪽이 semantics 를 달지 않으면 트리에는 빈 컨테이너 하나만 남는다. 눈에는 버튼이 있지만 도구에는 없다.
- 게임 엔진, Lottie 애니메이션, 직접 그린 Canvas 도 같은 결과를 낸다.

## 알아둘 것

- 이런 화면은 좌표로 누르거나 스크린샷 픽셀로 읽어야 한다. 좌표는 팝업 배치가 바뀌면 빈 곳을 누른다.
- 픽셀 판독은 `adb exec-out screencap` 의 raw RGBA 를 쓰면 PNG 디코딩 없이 빠르다.
- 누른 결과도 노드로 확인할 수 없으니, 누른 뒤 같은 자리의 색이 바뀌었는지로 확인한다.
