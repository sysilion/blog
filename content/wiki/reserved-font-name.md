---
title: "Reserved Font Name"
date: 2026-10-13T12:31:33+09:00
draft: false
tags: ["font", "license"]
summary: "OFL 폰트에서 수정본이 쓸 수 없도록 원저작자가 예약한 폰트 이름."
altnames: ["RFN", "예약 폰트명"]
---

[[ofl|SIL OFL]] 저작권 고지에 `with Reserved Font Name X` 로 선언된 이름으로, 원본이 아닌 수정본은 이 이름을 쓸 수 없다.

## 무엇인가

- OFL 조건 3: 저작권자의 서면 허락 없이 Modified Version에 RFN을 쓰면 안 된다.
- 글리프 추가·서브셋·포맷 변환도 수정에 해당한다. 그래서 패치 도구는 이름을 바꾼다
  (예: Nerd Fonts의 D2Coding → D2Koding, Cascadia Code → CaskaydiaCove).
- RFN이 없는 OFL 폰트는 이름을 유지한 채 수정본을 배포할 수 있다.

## 알아둘 것

- 확인은 폰트에 동봉된 `OFL.txt` 첫 몇 줄을 보면 된다.
- 개인 용도로 로컬에서만 쓰는 건 배포가 아니므로 이름 문제는 재배포 시에만 걸린다.
