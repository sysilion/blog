---
title: "monkey"
date: 2026-10-07T23:33:37+09:00
draft: false
tags: ["android", "adb", "testing"]
summary: "기기에 무작위 입력을 쏟아붓는 안드로이드 스트레스 테스트 도구. 앱 실행 용도로도 흔히 쓰인다."
altnames: ["adb monkey", "UI/Application Exerciser Monkey"]
---

monkey 는 앱에 무작위 터치·키·제스처를 보내 안정성을 시험하는 안드로이드 기본 도구다.

## 무엇인가

- `adb shell monkey -p <패키지> <이벤트 수>` 형태로 쓴다. 지정한 패키지 안에서만 이벤트를 만든다.
- 이벤트 수를 `1` 로 주면 첫 이벤트인 앱 실행만 일어난다. 그래서 액티비티 이름을 몰라도
  앱을 띄울 수 있는 지름길로 널리 쓰인다.
- `--pct-touch`·`--pct-rotation` 등으로 이벤트 종류의 비율을 정하고, `-s` 시드로 같은 순서를 재현한다.

## 알아둘 것

- **끝날 때 화면 회전 잠금을 푼다.** 회전을 기본 방향으로 고정했다가 바로 풀기 때문에
  `accelerometer_rotation` 이 1이 된다. 사용자가 꺼 둔 자동 회전이 켜진다.
- 앱 실행만 필요하면 `cmd package resolve-activity --brief -c android.intent.category.LAUNCHER <패키지>`
  로 런처 액티비티를 찾아 `am start -n` 으로 띄우는 편이 부작용이 없다.
