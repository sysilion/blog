# blog

Hugo + [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 로 만든 정적 블로그.
`main` 브랜치에 push 하면 GitHub Actions 가 빌드해서 GitHub Pages 로 배포합니다.

- 공개 주소: https://bizu.is-a.dev/blog/
- 허브: https://bizu.is-a.dev/

## 로컬 실행

```bash
git clone --recurse-submodules https://github.com/sysilion/blog.git
cd blog
hugo server -D          # http://localhost:1313/blog/
```

## 글 쓰기

```bash
hugo new content posts/my-post.md
```

`content/posts/my-post.md` 의 프론트매터에서 `draft: false` 로 바꾸고 commit & push 하면 배포됩니다.

```yaml
---
title: "제목"
date: 2026-08-27T12:00:00+09:00
draft: false
tags: ["태그"]
summary: "목록에 보일 한 줄 요약"
---
```

## 위키 쓰기

`content/wiki/` 는 작업하다 알게 된 것을 짧게 쌓는 섹션입니다. 공개 주소는 https://bizu.is-a.dev/blog/wiki/ .

```bash
hugo new content wiki/my-note.md
```

글과 같은 사이트·같은 검색을 쓰지만, 홈 목록에는 노출되지 않습니다 (`params.mainSections: ["posts"]`).
본문은 **무슨 일이 → 원인 → 재현 → 그래서 → 한 줄** 순으로 짧게 씁니다.
항목이 길어지고 서로 엮이면 `content/posts/` 의 글로 승격시킵니다.

## 구조

| 경로 | 설명 |
| --- | --- |
| `hugo.yaml` | 사이트 설정 (제목, 메뉴, 테마 옵션) |
| `content/posts/` | 글 (마크다운) |
| `content/wiki/` | 위키 (짧은 기록) |
| `content/search.md` | 검색 페이지 |
| `content/archives.md` | 아카이브 페이지 |
| `static/` | 그대로 복사되는 정적 파일 (favicon 등) |
| `themes/PaperMod` | 테마 (git submodule) |
| `.github/workflows/deploy.yml` | 빌드·배포 자동화 |

## 테마 업데이트

```bash
git submodule update --remote --merge themes/PaperMod
```
