---
title: "WebM"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["미디어", "포맷"]
summary: "Matroska 기반 미디어 컨테이너. EBML 구조라 헤더 없이는 독립 디코딩이 안 된다."
altnames: ["EBML", "Matroska"]
---

Matroska를 기반으로 한 웹용 미디어 컨테이너. 브라우저 [[mediarecorder]] 의 기본 출력 포맷이다.
내부 구조는 **EBML**(Extensible Binary Meta Language) — 태그·길이·값이 중첩된 이진 트리다.

## 구조

- **init segment** — EBML 헤더 + 트랙 정보. 디코더 초기화에 필요하다.
- **cluster** — 실제 프레임 묶음. 재생은 keyframe으로 시작하는 cluster에서만 시작할 수 있다.

## 알아둘 것

연속 스트림을 조각으로 자를 때, **두 번째 이후 조각에는 헤더가 없어 독립 디코딩이 안 된다.**
첫 조각에서 init segment를 떼어 보관하고 조각마다 앞에 붙이고,
**keyframe으로 시작하는 cluster 경계에서만** 잘라야 한다.

EBML 요소 ID의 길이는 첫 바이트의 선행 0비트 개수가 정한다.

```js
const len = first >= 0x80 ? 1 : first >= 0x40 ? 2 : first >= 0x20 ? 3 : first >= 0x10 ? 4 : 0;
```

이렇게 자르면 조각 길이가 설정값과 달라지므로, 재생 로직은 시간이 아니라 **시퀀스 번호 기준**이어야 한다.
