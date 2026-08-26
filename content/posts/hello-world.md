---
title: "블로그를 열며"
date: 2026-08-27T02:45:00+09:00
draft: false
tags: ["잡담"]
summary: "Hugo + PaperMod로 정적 블로그를 만들었습니다."
---

첫 글입니다.

## 왜 정적 블로그인가

- **빠르다** — 서버 렌더링이 없으니 그냥 파일이 내려옵니다.
- **공짜다** — GitHub Pages에 그대로 올라갑니다.
- **버전 관리된다** — 글이 곧 마크다운 파일이고, 곧 커밋입니다.

## 글 쓰는 법

```bash
hugo new content posts/글-제목.md   # 초안 생성
hugo server -D                       # 로컬 미리보기 (draft 포함)
```

프론트매터에서 `draft: false`로 바꾸고 push 하면 GitHub Actions가 알아서 빌드·배포합니다.

## 코드 블록도 잘 나옵니다

```go
func main() {
	fmt.Println("hello, blog")
}
```

앞으로 개발하면서 막혔던 것들과 해결한 방법을 주로 남길 예정입니다.
