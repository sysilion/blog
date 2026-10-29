---
title: "Metro가 해석 오류 번들을 내려주는 동안 앱은 이전 JS로 계속 돈다"
date: 2026-10-23T06:50:00+09:00
draft: false
tags: ["react-native", "expo", "metro"]
summary: "파일은 디스크에 있는데 Metro는 UnableToResolveError를 내려줬고, 개발 빌드 앱은 아무 표시 없이 예전 코드로 동작했다."
---

Orca 모바일 앱을 에뮬레이터에서 확인하는데, 방금 고친 코드가 전혀 반영되지 않았다.
앱은 멀쩡히 열렸고 화면에 빨간 오류도 없었다. 임시 `console.log` 도 찍히지 않았다.

Metro가 실제로 무엇을 내려주는지 직접 받아 보니 번들이 아니라 오류였다.

```
{"type":"UnableToResolveError","originModulePath":".../use-native-device-verbs.ts",
 "targetModuleName":"./native-terminal-font", ...}
```

`native-terminal-font.ts` 는 디스크에 있었다. 직전에 `git stash -u` 와 `git stash pop` 으로
작업 트리를 잠깐 비웠다가 되돌렸고, 그 사이 새 파일이 사라졌다 다시 생겼다.

## 원인

[[metro]] 는 파일 감시로 모듈 그래프를 갱신한다. 감시가 놓친 파일은 디스크에 다시 생겨도
그래프에서 계속 없는 파일로 남았다. 정확히 어느 단계에서 놓쳤는지는 확인하지 못했다.

개발 빌드는 새 번들을 받지 못하면 이미 로드한 JS로 계속 돈다. 오류는 Metro 터미널에도 눈에 띄게 남지 않았다.

## 재현

```bash
# Metro가 지금 내려주는 번들을 직접 받아 본다
curl -s "http://localhost:8081/index.bundle?platform=android&dev=true" | head -c 300
# {"type":"UnableToResolveError", ...} 로 시작하면 앱은 옛 코드다

# 캐시를 비우고 다시 띄우면 해결됐다
npx expo start --dev-client --clear
```

## 그래서

- 코드 변경이 "아무 효과가 없을" 때 앱 로직부터 의심하지 말고, 번들에 그 코드가 들어 있는지부터 본다. `grep` 한 번이면 된다.
- 작업 트리를 통째로 뒤집는 git 명령(stash, checkout, rebase) 뒤에는 Metro를 `--clear` 로 다시 띄운다.

## 한 줄

변경이 안 먹히면 `curl` 로 받은 번들에서 바꾼 문자열을 `grep` 하고, 없으면 `expo start --clear`.
