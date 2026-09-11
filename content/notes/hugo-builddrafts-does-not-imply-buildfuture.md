---
title: "hugo --buildDrafts 로는 미래 날짜 글이 안 나온다"
date: 2026-09-10T15:35:00+09:00
draft: false
tags: ["hugo", "build"]
summary: "draft 와 future 는 별개 스위치다. --buildFuture 를 따로 줘야 한다."
---

## 무슨 일이

비밀글 암호화 스크립트가 렌더 결과를 못 찾고 죽었다.

```
Error: 렌더 결과가 없다: test-secret
```

`draft: true` 도 아니고, 파일도 분명히 `content/` 에 있고, `hugo --buildDrafts` 로 빌드했는데
섹션 목록(`index.html`)만 생기고 개별 페이지 디렉터리가 아예 없었다.

## 원인

프론트매터 날짜가 `2026-09-10T16:00:00+09:00` 이었는데 그때 시각이 **15시 33분**이었다.
27분 뒤 날짜였던 것이다. [[hugo]] 는 `buildFuture: false` 가 기본이라 미래 날짜 페이지를 통째로 뺀다.

`--buildDrafts` 는 `draft: true` 만 푼다. **future 는 별개 스위치다.** 셋 다 따로 있다.

| 프론트매터 | 설정 | 플래그 |
| --- | --- | --- |
| `draft: true` | `buildDrafts` | `-D`, `--buildDrafts` |
| `date` 가 미래 | `buildFuture` | `-F`, `--buildFuture` |
| `expiryDate` 가 과거 | `buildExpired` | `-E`, `--buildExpired` |

에러도 경고도 없다. 그냥 페이지가 없다.

## 재현

```bash
hugo new content notes/x.md
# date 를 몇 분 뒤로 바꾸고
sed -i '' 's/^draft: true/draft: false/' content/notes/x.md

hugo --quiet --buildDrafts --destination /tmp/a
ls /tmp/a/notes/x 2>&1        # No such file or directory

hugo --quiet --buildDrafts --buildFuture --destination /tmp/b
ls /tmp/b/notes/x             # index.html
```

`hugo list future` 로 미리 확인할 수도 있다.

## 그래서

빌드 파이프라인에서 페이지를 프로그램으로 집어갈 때는 `--buildDrafts --buildFuture` 를 같이 준다.
`hugo new` 가 채우는 `date` 는 **생성 시각**이라, 프론트매터를 손으로 만들며 시각을 올려 적으면
바로 이 함정에 빠진다.

## 한 줄

> **`-D` 는 draft 만 푼다. 미래 날짜는 `-F` 다.**
