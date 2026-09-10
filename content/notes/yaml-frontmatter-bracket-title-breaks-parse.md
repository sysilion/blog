---
title: "frontmatter 제목이 대괄호로 시작하면 YAML 파싱이 통째로 실패한다"
date: 2026-09-10T16:01:00+09:00
draft: false
tags: ["yaml", "vite", "콘텐츠 파이프라인"]
summary: "title: [아카이브] ... 은 문자열이 아니라 flow sequence 로 파싱된다. 앱은 백지가 되고 에러는 yaml.js 내부만 가리킨다."
---

마크다운 문서를 게임 콘텐츠로 쓰는 파이프라인을 만들다가, 문서 하나를 추가한 순간
앱 전체가 백지가 됐다. 콘솔 에러는 이렇게만 나온다.

```
YAMLParseError: Unexpected scalar at node end at line 4, column 15
title: [아카이브] 한별호 그날 진짜 이유 아는 사람 있냐
              ^^^^^^^^^^^^^^^^^^^^^
```

## 원인

[[yaml]] 에서 `[` 로 시작하는 값은 문자열이 아니라 **flow sequence**(인라인 배열)다.
`[아카이브]` 까지는 원소 하나의 배열로 정상 파싱되고, 그 뒤에 붙은
`한별호 그날 진짜 이유 아는 사람 있냐` 가 배열 종료 후의 잉여 스칼라가 되어 터진다.

커뮤니티 게시물 제목은 `[공지]`, `[아카이브]`, `[속보]` 처럼 대괄호로 시작하는 경우가
아주 흔하다. 콘텐츠를 쓰는 쪽에서는 그게 YAML 문법이라는 생각을 안 한다.

## 재현

```bash
node -e 'import("yaml").then(({parse})=>parse("title: [공지] 점검 안내"))'
# YAMLParseError: Unexpected scalar at node end
node -e 'import("yaml").then(({parse})=>console.log(parse("title: \"[공지] 점검 안내\"")))'
# { title: '[공지] 점검 안내' }
```

## 그래서

- 제목은 인용부호로 감싼다. `title: "[아카이브] ..."`
- 더 중요한 건 **에러 메시지에 파일 경로가 없다는 것**이다. `import.meta.glob` 으로
  문서 수십 개를 파싱하는 구조에서 yaml.js 스택만 보고는 어느 파일인지 알 수 없다.
  파싱을 try/catch 로 감싸 경로를 붙여 다시 던져야 한다.

```ts
try {
  fm = parseYaml(m[1])
} catch (e) {
  throw new Error(`frontmatter 파싱 실패: ${path}\n${(e as Error).message}`)
}
```

- 덩달아 `date: 2025-11-14` 는 문자열이 아니라 **Date 객체**로 파싱된다.
  그대로 렌더하면 `2025-11-14T00:00:00.000Z` 가 화면에 뜬다. 파서에서 흡수할 것.

## 한 줄

콘텐츠를 데이터로 두는 파이프라인에서, YAML 파싱 에러는 반드시 파일 경로를 달고 나와야 한다.
