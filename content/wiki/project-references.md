---
title: "Project References"
date: 2026-11-02T02:10:38+09:00
draft: false
tags: ["typescript"]
summary: "tsconfig를 여러 하위 프로젝트로 나누고 references로 엮는 TypeScript 기능. tsc -b로 빌드한다."
altnames: ["프로젝트 참조", "tsconfig references", "tsc -b"]
---

Project References는 하나의 저장소를 여러 TypeScript 프로젝트(각자의 `tsconfig.json`)로 나누고,
`references` 배열로 의존 관계를 적는 기능이다. TypeScript 3.0에서 들어왔다.

## 구조

```json
// 루트 tsconfig.json (solution 스타일)
{ "files": [], "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }] }
```

참조되는 쪽은 `composite: true`(또는 그에 준하는 설정)를 켜서 증분 빌드 정보(`.tsbuildinfo`)를 남긴다.
[[vite]] 템플릿은 브라우저 코드(`tsconfig.app.json`)와 `vite.config.ts`(`tsconfig.node.json`)를
서로 다른 `lib`/`types` 로 검사하려고 이 구조를 쓴다.

## 알아둘 것

- `tsc -b`(build 모드)만 `references` 를 따라간다. `tsc -p <루트>` 는 루트 설정만 보고, `files: []` 면 아무것도 검사하지 않은 채 성공한다.
- `tsc -b` 는 의존 순서대로 빌드하고, 바뀌지 않은 하위 프로젝트는 건너뛴다.
- 에디터(tsserver)는 열린 파일이 속한 하위 프로젝트를 스스로 찾으므로, 에디터에서는 오류가 보이는데 CLI는 통과하는 어긋남이 생길 수 있다.
