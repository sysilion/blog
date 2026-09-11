---
title: "기존 Hugo 비밀글 도구는 전부 평문을 저장소에 남긴다"
date: 2026-09-10T16:20:00+09:00
draft: false
tags: ["hugo", "security", "blog"]
summary: "빌드 후 public/ 을 암호화하는 구조라 private 저장소가 전제다. public 저장소면 무의미하다."
---

## 무슨 일이

이 블로그에 비밀글을 붙이려고 기존 도구를 먼저 찾아봤다. StatiCrypt, hugo-encrypt,
hugo_enc, HugoMods encrypt — 넷 다 [[aes-gcm]] 계열로 제대로 암호화하고 브라우저에서
[[webcrypto]] 로 푼다. 암호학적으로는 멀쩡하다.

그런데 이 블로그(`sysilion/blog`)는 **public 저장소라 하나도 쓸 수 없었다.**

## 원인

전부 **빌드 후 처리** 방식이다.

```
content/*.md (평문)  →  hugo  →  public/*.html (평문)  →  CLI 가 걸어다니며 암호화
```

암호화 대상이 `public/` 이다. 원문 마크다운은 `content/` 에 평문 그대로 남고, 그게 커밋된다.
HugoMods 문서가 이걸 대놓고 적어둔다 — 저장소를 private 으로 유지하라고.

즉 이 도구들이 지키는 건 **배포된 사이트를 우연히 방문한 사람**이지, 저장소를 볼 수 있는
사람이 아니다. public 저장소에서는 자물쇠 옆에 열쇠를 붙여두는 꼴이 된다.

## 재현

```bash
# 도구를 쓴 뒤 저장소에 평문이 남았는지 본다
grep -rl "비밀로 하려던 문장" content/
git log -p --all -S "비밀로 하려던 문장" | head
```

한 번이라도 평문을 커밋했으면 히스토리에서도 지워야 한다. force push 가 필요하다.

## 그래서

평문이 저장소 밖에 있는 구조로 직접 만들었다. `secret-src/` (gitignore) 에 평문을 두고,
[[hugo]] 로 렌더한 HTML만 암호화해 `content/secret/` 에 스텁으로 넣는다. 커밋되는 건 암호문뿐이다.
구현은 `blog/scripts/secret.mjs`, `blog/layouts/secret/single.html`.

남는 한계는 그대로다. GitHub Pages 는 서버 인증이 없어 **암호문을 누구에게나 내준다.**
공격자가 오프라인에서 무한정 [[pbkdf2]] 를 돌릴 수 있으므로 짧은 비밀번호는 의미가 없다.

## 한 줄

> **기성 Hugo 암호화 도구의 위협 모델은 "사이트 방문자"지 "저장소 열람자"가 아니다.**
