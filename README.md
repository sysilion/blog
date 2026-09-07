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

## 세 가지 콘텐츠

| 대상 | 경로 | 공개 주소 | 단위 |
| --- | --- | --- | --- |
| 글 | `content/posts/` | `/blog/posts/` | 완결된 이야기 |
| 위키 | `content/wiki/` | `/blog/wiki/` | **용어 하나** |
| 노트 | `content/notes/` | `/blog/notes/` | **사건 하나** |

홈 목록에는 글만 노출됩니다 (`params.mainSections: ["posts"]`). 셋 다 같은 검색을 씁니다.

### 위키 — 용어 문서

```bash
hugo new content wiki/apfs.md      # archetypes/wiki.md 사용
```

```yaml
---
title: "APFS"                       # 용어 그 자체
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["macos", "filesystem"]
summary: "목록·색인에 뜰 한 줄 정의"
altnames: ["Apple File System"]     # 이 이름으로도 링크된다
---
```

본문은 **한 문장 정의 → 무엇인가 → 알아둘 것** 순. 사건 서술은 노트로 넘깁니다.

### 노트 — 사건 기록

```bash
hugo new content notes/my-note.md  # archetypes/notes.md 사용
```

본문은 **무슨 일이 → 원인 → 재현 → 그래서 → 한 줄** 순. 재현 가능한 명령·코드를 반드시 넣습니다.
분량은 스크롤 한 번. 넘으면 글로 승격시킵니다.

## 위키링크 `[[...]]`

글·노트·용어 문서 어디서나 `[[용어]]` 로 용어 문서를 가리킵니다.

```markdown
[[apfs]]                     → APFS            (문서 제목으로 표시)
[[shift-jis|Shift-JIS]]      → Shift-JIS       (표시명 지정)
[[아직-없는-용어]]            → 빨간 링크        (위키 색인의 '아직 없는 문서'로 모임)
```

해석 규칙:

- **키는 파일 slug · 문서 제목 · `altnames`** 셋 다. 대소문자·공백·언더스코어 차이는 무시됩니다.
- 링크된 쪽에는 **역링크**("여기를 가리키는 문서")가 자동으로 생깁니다. 따로 적을 필요 없습니다.
- 코드 블록과 인라인 코드 안의 `[[...]]` 는 건드리지 않습니다. `bash` 의 `[[ -f x ]]` 도 안전합니다.
- **표 안에서는 파이프를 이스케이프해야 합니다** — `[[slug\|표시명]]`. 안 하면 열 구분자로 먹힙니다.
- 제목(`##`)에는 쓰지 마세요. 목차(TOC)는 원문에서 만들어져 대괄호가 그대로 남습니다.

구현은 `layouts/_partials/wiki/` 에 있습니다. Hugo(goldmark)는 `[[...]]` 를 파싱하지 않으므로
렌더된 HTML을 후처리합니다.

## 구조

| 경로 | 설명 |
| --- | --- |
| `hugo.yaml` | 사이트 설정 (제목, 메뉴, 테마 옵션) |
| `content/posts/` | 글 |
| `content/wiki/` | 위키 — 용어 문서 |
| `content/notes/` | 노트 — 사건 기록 |
| `layouts/wiki/list.html` | 위키 색인 (머리글자 그룹 + 아직 없는 문서) |
| `layouts/_partials/wiki/` | 위키링크·역링크·필요문서 구현 |
| `assets/css/extended/wiki.css` | 위키 관련 스타일 |
| `content/search.md` | 검색 페이지 |
| `content/archives.md` | 아카이브 페이지 |
| `static/` | 그대로 복사되는 정적 파일 (favicon 등) |
| `themes/PaperMod` | 테마 (git submodule) |
| `.github/workflows/deploy.yml` | 빌드·배포 자동화 |

## 테마 업데이트

```bash
git submodule update --remote --merge themes/PaperMod
```
