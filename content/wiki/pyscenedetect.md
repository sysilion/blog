---
title: "PySceneDetect"
date: 2026-10-27T01:24:33+09:00
draft: false
tags: ["python", "영상편집"]
summary: "영상의 장면 전환 지점을 찾아주는 Python 라이브러리이자 CLI."
altnames: ["scenedetect"]
---

PySceneDetect는 프레임 간 변화를 분석해 영상의 장면 경계를 찾는 오픈소스 도구다.

## 무엇인가

- `pip install scenedetect[opencv]` 로 설치한다. CLI 이름은 `scenedetect` 다.
- 검출기 종류:
  - `ContentDetector`: 인접 프레임의 HSV 변화량이 임계값(기본 27)을 넘으면 컷으로 본다.
  - `AdaptiveDetector`: 주변 프레임 평균 대비 변화량을 본다. 카메라 움직임에 덜 속는다.
  - `ThresholdDetector`: 밝기가 기준을 넘나드는 페이드 인/아웃을 잡는다.
- 결과는 장면 목록(CSV), 장면별 썸네일, ffmpeg 로 자른 클립으로 내보낼 수 있다.

## 알아둘 것

- 기준이 "장면이 바뀌었는가"라서 배경이 고정된 화면의 [[jump-cut|점프컷]]은 잘 못 잡는다.
- `min_scene_len` (프레임 단위)보다 짧은 장면은 합쳐진다. 짧은 컷을 세려면 낮춰야 한다.
- 0.7 부터 `FrameTimecode.get_seconds()` 가 deprecated 이고 `.seconds` 속성을 쓴다.
