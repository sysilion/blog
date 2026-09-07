---
title: "MediaRecorder"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["브라우저", "미디어"]
summary: "MediaStream을 컨테이너로 인코딩하는 브라우저 API. stop()은 flush가 아니다."
altnames: ["MediaRecorder API"]
---

**MediaRecorder** 는 `MediaStream` 을 받아 컨테이너 포맷(대개 [[webm|WebM]])으로 인코딩해
`dataavailable` 이벤트로 Blob을 내주는 브라우저 API다.

## 알아둘 것

**`stop()` 은 인코더 백로그를 flush하지 않고 버린다.** 인코딩은 캡처보다 뒤처지는데,
아직 인코딩되지 않은 프레임은 마무리되지 않고 그냥 사라진다. 해상도가 높아 인코더가 밀릴수록
손실이 커진다. 따라서 **chunk마다 `stop()` → `start()` 를 반복하는 방식은 프레임을 잃는다.**

연속 스트림을 조각으로 나눠야 하면 recorder를 멈추지 않고 `start(timeslice)` 로 계속 돌린 뒤,
바이트 스트림을 컨테이너 경계에 맞춰 직접 자르는 편이 맞다. 이때 두 번째 이후 Blob에는
헤더가 없어서 독립 디코딩이 안 된다는 문제를 따로 풀어야 한다.
