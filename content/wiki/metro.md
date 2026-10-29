---
title: "Metro"
date: 2026-10-23T06:50:00+09:00
draft: false
tags: ["react-native", "번들러", "도구"]
summary: "React Native의 JavaScript 번들러. 개발 중에는 서버로 떠서 앱에 번들을 내려준다."
altnames: ["Metro bundler", "metro-bundler"]
---

React Native와 Expo가 쓰는 JavaScript 번들러. 앱 코드와 의존성을 하나의 번들로 묶고, 개발 중에는 HTTP 서버(기본 8081 포트)로 떠서 앱이 번들을 받아 가게 한다.

## 구조

- 프로젝트 파일을 감시해서 모듈 그래프를 메모리에 유지한다. 파일이 바뀌면 바뀐 모듈만 다시 변환해 델타 번들을 보낸다(Fast Refresh).
- `index.bundle?platform=android&dev=true` 처럼 URL 쿼리로 플랫폼과 모드를 고른다. 같은 서버가 iOS·Android·웹 번들을 따로 만든다.
- `foo.web.ts`, `foo.android.ts` 같은 플랫폼 확장자를 먼저 찾고, 없으면 `foo.ts` 로 해석한다.
- 변환 결과는 디스크 캐시에 남는다. `--clear`(Expo) 또는 `--reset-cache` 로 비운다.

## 알아둘 것

- 해석에 실패하면 서버는 번들 대신 `UnableToResolveError` JSON을 돌려준다. 이미 실행 중인 개발 빌드는 그 상태에서 이전 JS로 계속 동작할 수 있다.
- 에뮬레이터·실기기에서는 `adb reverse tcp:8081 tcp:8081` 로 기기의 localhost를 호스트 Metro에 이어 준다. 기기에 전역 HTTP 프록시가 걸려 있으면 이 연결이 프록시로 빠져서 실패한다.
- 프로젝트 루트 밖의 파일은 `watchFolders` 에 넣지 않으면 해석하지 못한다. 모노레포에서 자주 걸린다.
