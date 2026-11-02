---
title: "Vite 템플릿에서 tsc --noEmit -p . 은 파일을 하나도 검사하지 않는다"
date: 2026-11-02T02:10:38+09:00
draft: false
tags: ["typescript", "vite", "frontend"]
summary: "루트 tsconfig.json이 files: []와 references뿐이라, 타입 오류가 있어도 exit 0으로 끝난다."
---

## 무슨 일이

chicle 프론트엔드 타입체크로 `npx tsc --noEmit -p .` 를 돌렸더니 통과했다.
일부러 `const x: number = "a"` 를 넣은 파일을 만들어도 결과는 똑같이 exit 0이었다.

## 원인

Vite 템플릿의 루트 `tsconfig.json` 은 [[project-references]] 용 껍데기다.

```json
{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }
```

`-p` 는 그 설정 하나만 컴파일하고 `references` 를 따라가지 않는다. `files` 가 비어 있으니 검사할 파일이 없다.
참조된 프로젝트까지 빌드하는 것은 `tsc -b`(build 모드)다.

## 재현

```bash
cd frontend
npx tsc --noEmit -p . --listFilesOnly | wc -l          # 0
echo 'const x: number = "a"' > src/__probe.ts
npx tsc --noEmit -p .; echo "exit $?"                  # exit 0
npx tsc --noEmit -p tsconfig.app.json                  # TS2322 보고
npx tsc -b                                             # 참조를 따라가 TS2322 보고
rm src/__probe.ts
```

## 그래서

템플릿의 `build` 스크립트가 `tsc -b && vite build` 인 이유가 이것이다. 타입체크만 할 때도 `tsc -b` 나
`-p tsconfig.app.json` 을 쓴다.

## 한 줄

타입체크가 너무 빨리 통과하면 `--listFilesOnly` 로 검사 대상이 0개인지 먼저 본다.
