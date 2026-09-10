---
title: "Vite optimizeDeps"
date: 2026-09-08T18:10:00+09:00
draft: false
tags: ["vite", "bundler"]
summary: "Vite 개발 서버가 node_modules 의존성을 esbuild로 미리 하나로 묶어 두는 사전 번들링 단계."
altnames: ["optimizeDeps", "dependency pre-bundling", "사전 번들링"]
---

Vite 개발 서버가 `node_modules`의 의존성을 esbuild로 미리 ESM 청크로 묶어 `node_modules/.vite/deps`에 캐시하는 단계다.

## 무엇인가

- 목적은 둘이다. CommonJS/UMD를 ESM으로 바꾸고, 수백 개 내부 모듈을 가진 패키지의 요청 수를 줄인다.
- 소스에서 발견한 import 경로 하나하나가 진입점이 된다. 깊은 경로(`pkg/sub/mod`)를 여러 개 쓰면 진입점도 여러 개다.
- 새 의존성이 나타나면 재최적화 후 페이지를 강제 새로 고침한다.
- `optimizeDeps.include` / `exclude`로 대상을 조절한다. `exclude`한 패키지는 원본 파일이 그대로 서빙된다.

## 알아둘 것

- 사이드이펙트 등록(전역 레지스트리에 스스로를 넣는 모듈)에 의존하는 라이브러리는 청크 분할로 등록이 갈리거나 중복될 수 있다. Babylon.js의 셰이더 include가 그렇다.
- 캐시 디렉터리는 프로젝트 `node_modules/.vite`다. 실행 중 `node_modules`가 사라지면(예: `git stash -u`) 상위 디렉터리의 `node_modules`로 캐시 위치를 옮겨 잡을 수 있다.
- 프로덕션 빌드(rollup)에는 이 단계가 없다. 개발 서버에서만 나는 오류라면 먼저 의심한다.
