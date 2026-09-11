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

## 비밀글

비밀번호를 알아야 열리는 글. 본문은 **AES-256-GCM 으로 암호화된 상태로만 저장소에 들어가고**,
브라우저가 [WebCrypto](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API) 로 복호화합니다.
GitHub Pages 는 서버 인증을 걸 수 없으므로 이 방법뿐입니다.

**키는 사이트에 하나입니다.** 비밀번호를 한 번 넣으면 그 브라우저에서 모든 비밀글이 열립니다
(글마다 IV 만 다릅니다). 유도된 키는 `sessionStorage` 에 있다가 탭을 닫으면 사라지고,
'30일 기억'을 고르면 `localStorage` 로 갑니다. 어느 쪽이든 이 브라우저 밖으로 나가지 않습니다.
제목 옆 **잠그기** 버튼이 지웁니다.

```bash
mkdir -p secret-src
$EDITOR secret-src/my-secret.md     # 평문. secret-src/ 는 .gitignore 됨
node scripts/secret.mjs             # 비밀번호를 물어보고 암호화
hugo server -D                      # localhost 에서 확인
git add content/secret && git commit && git push
```

새로 클론한 곳에서는 반대로 풉니다. 암호문 안에 원본 마크다운이 같이 들어 있습니다.

```bash
git clone --recurse-submodules https://github.com/sysilion/blog.git
cd blog
node scripts/secret.mjs restore     # 비밀번호 → secret-src/*.md 가 되살아난다
```

| 명령 | 하는 일 |
| --- | --- |
| `node scripts/secret.mjs` | `secret-src/` → `content/secret/` 암호화 (기본) |
| `node scripts/secret.mjs restore` | `content/secret/` → `secret-src/` 복원 |
| `--force` | build: 변경 없어도 재암호화 · restore: 기존 평문 덮어쓰기 |
| `--rekey` | 비밀번호 변경. 솔트를 새로 뽑고 전부 다시 암호화합니다 |

`restore` 는 **이미 있는 평문을 덮어쓰지 않습니다.** 내용이 다르면 건너뛰고 알려줍니다.
손으로 고치던 원고가 날아가면 복구할 길이 없기 때문입니다. 덮어쓰려면 `--force`.

평문 프론트매터:

```yaml
---
title: "실제 제목"              # 암호문 안에 들어간다. 풀어야 보인다
publicTitle: "비밀글"           # 목록·잠금 화면에 뜰 제목. 생략하면 "비밀글"
date: 2026-09-10T15:00:00+09:00
---
```

동작 순서:

1. `secret-src/*.md` 를 `content/secretbuild/` 로 옮겨 `hugo` 로 렌더합니다.
   → **위키링크·코드 하이라이트가 평소와 똑같이 적용됩니다.**
2. **렌더된 HTML · 실제 제목 · 원본 마크다운**을 JSON 으로 묶어 AES-256-GCM 으로 암호화합니다.
   원본을 같이 넣는 덕에 `restore` 가 가능합니다. 제목은 목록에서 쓰려고 한 번 더 따로 암호화합니다.
3. 암호문만 담긴 스텁을 `content/secret/<slug>.md` 에 씁니다. **이것만 커밋됩니다.**
   솔트·반복횟수·검증값은 `data/secret.json` 에 한 벌만 둡니다 (비밀이 아닙니다).
4. `layouts/_partials/secret/vault.html` 이 비밀번호 → 키 유도 → 캐시를 맡고,
   `secret/single.html` · `secret/list.html` 이 그 키로 본문과 제목을 풉니다.

알아둘 것:

- **평문은 `secret-src/` 에만 있습니다.** 다만 암호문 안에 원본이 들어 있으므로
  비밀번호를 기억하는 한 저장소 자체가 백업입니다. **비밀번호를 잃으면 원문도 같이 잃습니다.**
- 이 저장소는 public 입니다. 암호문이 이미 공격자 손에 있는 셈이라 **오프라인 무차별 대입**이
  가능합니다. 짧은 비밀번호는 뚫립니다. 긴 패스프레이즈를 쓰세요.
- 공개되는 것: 스텁의 제목(`publicTitle`)·날짜·본문 길이. 태그·요약·목차는 넣지 않습니다.
  **파일명이 곧 URL 이므로 slug 도 공개됩니다.** 내용을 드러내지 않는 이름을 쓰세요.
- 잠긴 목록에는 `publicTitle` 만 뜨고, 풀면 진짜 제목이 그 자리에 채워집니다.
- **GitHub Actions 에 비밀번호를 넣을 필요가 없습니다.** 암호화는 커밋 전 로컬에서 끝나고,
  CI 는 이미 암호화된 스텁을 빌드할 뿐입니다. Actions secret 에 넣으면 위험만 늘어납니다.
- WebCrypto 는 [보안 컨텍스트](https://developer.mozilla.org/docs/Web/Security/Secure_Contexts)에서만
  돕니다 → `https` 또는 `localhost`. LAN IP(`192.168.x.x`)로 열면 잠금이 풀리지 않습니다.
- 본문을 고치면 `node scripts/secret.mjs` 를 다시 돌립니다. 내용이 그대로면 건너뜁니다
  (`--force` 로 강제). 판단 기준은 `.secret-cache.json` (역시 `.gitignore`).
- 복호화된 본문에는 PaperMod 의 코드 복사 버튼이 붙지 않습니다. 빌드 시점에 다는 기능이라 그렇습니다.

## 구조

| 경로 | 설명 |
| --- | --- |
| `hugo.yaml` | 사이트 설정 (제목, 메뉴, 테마 옵션) |
| `content/posts/` | 글 |
| `content/wiki/` | 위키 — 용어 문서 |
| `content/notes/` | 노트 — 사건 기록 |
| `secret-src/` | **비밀글 평문. gitignore — 커밋되지 않음** |
| `content/secret/` | 비밀글 암호문 스텁 |
| `data/secret.json` | 비밀글 키체인 — 솔트·반복횟수·검증값 (비밀 아님, 커밋됨) |
| `scripts/secret.mjs` | 비밀글 암호화기·복원기 |
| `layouts/_partials/secret/vault.html` | 비밀번호 → 키 유도·캐시·입력폼 (공용) |
| `layouts/secret/single.html` | 비밀글 본문 복호화 |
| `layouts/secret/list.html` | 비밀글 목록 + 제목 복호화 |
| `layouts/secretbuild/single.html` | 비밀글 평문 렌더 전용 (암호화 중간 단계) |
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
