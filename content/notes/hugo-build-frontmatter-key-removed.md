---
title: "Hugo 의 _build 프론트매터 키는 제거됐다. 이제 build 다"
date: 2026-09-11T11:10:00+09:00
draft: false
tags: ["hugo", "build"]
summary: "0.145.0 에서 없어졌는데, 무시하는 게 아니라 ERROR 로 빌드를 세운다."
---

## 무슨 일이

비밀글 스텁을 사이트 전체 수집(홈·RSS·검색)에서 빼려고 프론트매터에 빌드 옵션을 넣었다.

```yaml
_build:
  list: local
```

빌드가 통째로 실패했다.

```
ERROR deprecated: The "_build" front matter key was deprecated in Hugo 0.145.0
      and subsequently removed. Use "build" instead.
ERROR error building site: logged 1 error(s)
```

## 원인

[[hugo]] 0.145.0 에서 **`_build` → `build`** 로 이름이 바뀌었다. 오래된 블로그 글과 예제는 아직
전부 `_build` 로 적혀 있다.

고약한 건 **모르는 키로 취급해 무시하지 않는다**는 점이다. Hugo 는 제거된 키를 발견하면
deprecation 을 `ERROR` 레벨로 찍고, 빌드 마지막에 `logged 1 error(s)` 로 exit 1 을 낸다.
`--quiet` 를 줘도 종료 코드는 1이다. 스크립트가 hugo 를 호출하는 구조라면 여기서 죽는다.

## 재현

```bash
cat > content/posts/x.md <<'EOF'
---
title: "x"
_build:
  list: local
---
EOF
hugo --quiet; echo "exit=$?"      # exit=1

sed -i '' 's/^_build:/build:/' content/posts/x.md
hugo --quiet; echo "exit=$?"      # exit=0
```

## 그래서

`build` 로 바꾸면 끝이다. 값은 그대로다.

| `list` | 뜻 |
| --- | --- |
| `always` | 어디서나 목록에 (기본) |
| `local` | **자기 섹션 목록에만.** 사이트 전체 수집(홈·RSS·검색 인덱스)에서는 빠진다 |
| `never` | 어디에도 안 뜬다. URL 로만 접근 |

`blog/scripts/secret.mjs` 가 비밀글 스텁에 `build: { list: local }` 을 박는다.

## 한 줄

> **`_build` 는 죽었다. `build` 를 쓴다. 그리고 옛 키는 경고가 아니라 빌드 실패다.**
