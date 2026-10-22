# blog

Hugo + [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 로 만든 정적 블로그.
`main` 브랜치에 push 하면 GitHub Actions 가 빌드해서 GitHub Pages 에 올립니다.

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

`content/posts/my-post.md` 프론트매터의 `draft` 를 `false` 로 바꾸고 commit, push 하면 배포됩니다.

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
| 위키 | `content/wiki/` | `/blog/wiki/` | 용어 하나 |
| 노트 | `content/notes/` | `/blog/notes/` | 사건 하나 |

홈 목록에는 글만 나옵니다(`params.mainSections: ["posts"]`). 검색은 셋이 같이 씁니다.

### 위키: 용어 문서

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

본문은 한 문장 정의, 무엇인가, 알아둘 것 순서로 씁니다. 사건 이야기는 노트에 씁니다.

### 노트: 사건 기록

```bash
hugo new content notes/my-note.md  # archetypes/notes.md 사용
```

본문은 무슨 일이, 원인, 재현, 그래서, 한 줄 순서로 씁니다. 재현할 수 있는 명령이나 코드를 꼭 넣습니다.
분량은 스크롤 한 번 정도이고, 그보다 길어지면 글로 옮깁니다.

## 위키링크 `[[...]]`

글, 노트, 용어 문서 어디서든 `[[용어]]` 로 용어 문서를 가리킬 수 있습니다.

```markdown
[[apfs]]                     → APFS            (문서 제목으로 표시)
[[shift-jis|Shift-JIS]]      → Shift-JIS       (표시명 지정)
[[아직-없는-용어]]            → 빨간 링크        (위키 색인의 '아직 없는 문서'로 모임)
```

링크는 이렇게 해석합니다.

- 파일 slug, 문서 제목, `altnames` 중 어느 것으로도 찾습니다. 대소문자, 공백, 언더스코어 차이는 무시합니다.
- 링크된 문서에는 역링크("여기를 가리키는 문서")가 자동으로 붙으니 따로 적지 않아도 됩니다.
- 코드 블록과 인라인 코드 안의 `[[...]]` 는 그대로 둡니다. `bash` 의 `[[ -f x ]]` 도 깨지지 않습니다.
- 표 안에서는 파이프를 `[[slug\|표시명]]` 처럼 이스케이프해야 합니다. 안 하면 열 구분자로 읽힙니다.
- 제목(`##`)에는 쓰지 마세요. 목차(TOC)는 원문으로 만들어서 대괄호가 그대로 남습니다.

구현은 `layouts/_partials/wiki/` 에 있습니다. Hugo(goldmark)가 `[[...]]` 를 파싱하지 않아서
렌더된 HTML을 후처리하는 방식입니다.

## 비밀글

비밀번호를 알아야 열리는 글입니다. 본문은 AES-256-GCM 으로 암호화한 상태로만 저장소에 들어가고,
브라우저가 [WebCrypto](https://developer.mozilla.org/docs/Web/API/Web_Crypto_API) 로 복호화합니다.
GitHub Pages 에는 서버 인증을 걸 수 없어서 이렇게 했습니다.

키는 사이트 전체에 하나라서, 비밀번호를 한 번 넣으면 그 브라우저에서 비밀글이 전부 열립니다
(글마다 다른 건 IV 뿐입니다). 유도한 키는 `sessionStorage` 에 두었다가 탭을 닫으면 사라지고,
'30일 기억'을 고르면 `localStorage` 에 저장합니다. 어느 쪽이든 브라우저 밖으로 나가지 않습니다.
지우려면 제목 옆 '잠그기' 버튼을 누릅니다.

```bash
mkdir -p secret-src
$EDITOR secret-src/my-secret.md     # 평문. secret-src/ 는 .gitignore 됨
node scripts/secret.mjs             # 비밀번호를 물어보고 암호화
hugo server -D                      # localhost 에서 확인
git add content/secret && git commit && git push
```

새로 클론한 곳에서는 반대로 풀면 됩니다. 암호문 안에 원본 마크다운도 들어 있습니다.

```bash
git clone --recurse-submodules https://github.com/sysilion/blog.git
cd blog
node scripts/secret.mjs restore     # 비밀번호 → secret-src/*.md 가 되살아난다
```

| 명령 | 하는 일 |
| --- | --- |
| `node scripts/secret.mjs` | `secret-src/` → `content/secret/` 암호화 (기본) |
| `node scripts/secret.mjs restore` | `content/secret/` → `secret-src/` 복원 |
| `--force` | build에서는 변경이 없어도 재암호화, restore에서는 기존 평문 덮어쓰기 |
| `--rekey` | 비밀번호 변경. 솔트를 새로 뽑고 전부 다시 암호화 |

`restore` 는 이미 있는 평문을 덮어쓰지 않습니다. 내용이 다르면 건너뛰고 알려줍니다.
손으로 고치던 원고가 날아가면 되살릴 방법이 없어서입니다. 덮어쓰려면 `--force` 를 붙입니다.

평문 프론트매터는 이렇게 씁니다.

```yaml
---
title: "실제 제목"              # 암호문 안에 들어간다. 풀어야 보인다
publicTitle: "비밀글"           # 목록·잠금 화면에 뜰 제목. 생략하면 "비밀글"
date: 2026-09-10T15:00:00+09:00
---
```

동작 순서는 다음과 같습니다.

1. `secret-src/*.md` 를 `content/secretbuild/` 로 옮겨 `hugo` 로 렌더합니다.
   그래서 위키링크와 코드 하이라이트가 평소 글과 똑같이 들어갑니다.
2. 렌더된 HTML, 실제 제목, 원본 마크다운을 JSON 으로 묶어 AES-256-GCM 으로 암호화합니다.
   원본이 들어 있어서 `restore` 를 할 수 있습니다. 제목은 목록에서 쓰려고 따로 한 번 더 암호화합니다.
3. 암호문만 담은 스텁을 `content/secret/<slug>.md` 에 씁니다. 커밋되는 건 이 파일뿐입니다.
   솔트, 반복횟수, 검증값은 `data/secret.json` 에 한 벌만 둡니다(비밀 아님).
4. `layouts/_partials/secret/vault.html` 이 비밀번호를 받아 키를 유도하고 캐시하며,
   `secret/single.html` 과 `secret/list.html` 이 그 키로 본문과 제목을 풉니다.

알아둘 것

- 평문 파일은 `secret-src/` 에만 있습니다. 암호문 안에 원본이 들어 있으니 비밀번호만 기억하면
  저장소가 곧 백업입니다. 반대로 비밀번호를 잃으면 원문도 함께 잃습니다.
- 이 저장소는 public 입니다. 누구나 암호문을 받아 오프라인에서 무차별 대입을 할 수 있으므로
  짧은 비밀번호는 뚫립니다. 긴 패스프레이즈를 쓰세요.
- 스텁의 제목(`publicTitle`), 날짜, 본문 길이는 공개됩니다. 태그, 요약, 목차는 스텁에 넣지 않습니다.
  파일명이 URL 이 되므로 slug 도 드러납니다. 내용을 짐작할 수 없는 이름을 쓰세요.
- 잠긴 목록에는 `publicTitle` 만 보이고, 잠금을 풀면 그 자리에 진짜 제목이 들어갑니다.
- GitHub Actions 에는 비밀번호가 필요 없습니다. 암호화는 커밋 전에 로컬에서 끝나고,
  CI 는 암호화된 스텁을 빌드만 합니다. Actions secret 에 넣으면 노출될 곳만 하나 늘어납니다.
- WebCrypto 는 [보안 컨텍스트](https://developer.mozilla.org/docs/Web/Security/Secure_Contexts)(`https` 나 `localhost`)에서만
  동작합니다. LAN IP(`192.168.x.x`)로 열면 잠금이 풀리지 않습니다.
- 본문을 고쳤으면 `node scripts/secret.mjs` 를 다시 돌립니다. 바뀐 게 없으면 건너뛰고,
  `--force` 를 주면 강제로 다시 합니다. 변경 여부는 `.secret-cache.json`(이것도 `.gitignore`)으로 판단합니다.
- 복호화한 본문에는 PaperMod 의 코드 복사 버튼이 없습니다. 그 버튼은 빌드할 때 붙기 때문입니다.

## 구조

| 경로 | 설명 |
| --- | --- |
| `hugo.yaml` | 사이트 설정 (제목, 메뉴, 테마 옵션) |
| `content/posts/` | 글 |
| `content/wiki/` | 위키(용어 문서) |
| `content/notes/` | 노트(사건 기록) |
| `secret-src/` | 비밀글 평문. gitignore 대상이라 커밋되지 않음 |
| `content/secret/` | 비밀글 암호문 스텁 |
| `data/secret.json` | 비밀글 키체인: 솔트, 반복횟수, 검증값 (비밀 아님, 커밋됨) |
| `scripts/secret.mjs` | 비밀글 암호화기·복원기 |
| `layouts/_partials/secret/vault.html` | 비밀번호 입력폼, 키 유도, 캐시 (공용) |
| `layouts/secret/single.html` | 비밀글 본문 복호화 |
| `layouts/secret/list.html` | 비밀글 목록 + 제목 복호화 |
| `layouts/secretbuild/single.html` | 비밀글 평문 렌더 전용 (암호화 중간 단계) |
| `layouts/wiki/list.html` | 위키 색인 (머리글자 그룹 + 아직 없는 문서) |
| `layouts/_partials/wiki/` | 위키링크, 역링크, 필요 문서 구현 |
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
