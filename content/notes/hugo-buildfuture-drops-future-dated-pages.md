---
title: "배포는 성공했는데 글이 없다 — 손으로 찍은 미래 시각"
date: 2026-09-15T03:57:39+09:00
draft: false
tags: ["hugo", "github-actions"]
summary: "front matter 의 date 를 어림잡아 적었더니 커밋 시각보다 11분 미래였다. buildFuture: false 는 그런 페이지를 말없이 버린다."
---

## 무슨 일이

노트 하나와 위키 하나를 커밋하고 푸시했다. [[github-actions]] 는 27초 만에 초록불.
그런데 `/blog/notes/tauri-asset-protocol-caps-range-responses/` 가 404였다.

## 원인

front matter 의 시각이 커밋 시각보다 **미래**였다.

```
date(front matter)  2026-09-15T02:40:00+09:00
커밋 · 빌드          2026-09-15T02:29:49+09:00   ← 11분 이르다
hugo.yaml:9         buildFuture: false
```

[[buildfuture]] 가 `false` 면 빌드 시각보다 `date` 가 미래인 페이지는 출력되지 않는다.
**경고도 exit code 도 없다.** 워크플로는 성공하고 페이지만 사라진다.

시각이 미래로 찍힌 이유는 단순하다. `hugo new` 를 쓰지 않고 파일을 직접 쓰면서
`archetypes/notes.md` 의 `date: {{ .Date }}` 를 거치지 않았고, 시각을 어림잡아 적었다.
지금까지 쌓인 것들을 보면 전부 초가 `:00`, 분은 5분 단위다.

```
03:20 03:25 03:45 03:50 03:55 06:20 06:25 02:40
```

한 세션에서 문서를 여러 개 쓸 때 5분씩 늘려 적은 흔적이다. 시작점이 이미 현재 시각 근처면
뒤쪽 문서는 그대로 미래로 넘어간다. 2026-09-12 에도 03:40:40 커밋에 03:45 · 03:50 · 03:55
문서가 섞여 있었다. 그때는 두 시간 뒤 다음 푸시가 사이트를 통째로 다시 빌드하면서
저절로 올라왔고, 그래서 아무도 몰랐다.

## 재현

```bash
$ printf -- '---\ntitle: "probe"\ndate: %s\ndraft: false\n---\n' "$(date -v+10M -Iseconds)" \
    > content/notes/zz-future-probe.md      # 지금부터 10분 뒤

$ hugo --quiet -d /tmp/t1
$ ls -d /tmp/t1/notes/zz-future-probe
ls: /tmp/t1/notes/zz-future-probe: No such file or directory   # 빠졌다

$ hugo --quiet --buildFuture -d /tmp/t2
$ ls -d /tmp/t2/notes/zz-future-probe
/tmp/t2/notes/zz-future-probe                                   # 나온다
```

빌드하기 전에 확인할 수도 있다.

```bash
$ hugo list future
path,slug,title,date,...
content/notes/zz-future-probe.md,,probe,2026-09-15T04:06:41+09:00,...
```

## 그래서

내용은 멀쩡했으므로 다시 빌드시키는 것으로 끝났다. 파일은 건드리지 않았다.

```bash
git commit --allow-empty -m "Rebuild to publish future-dated notes" && git push
```

앞으로 문서를 만들 때는 시각을 읽어서 쓴다. `buildFuture: true` 로 바꾸는 선택지도 있지만
그러면 예약 발행을 못 하므로 두지 않았다.

```bash
hugo new content/notes/some-slug.md    # archetype 이 {{ .Date }} 를 채운다
date -Iseconds                         # 직접 쓸 때는 이 값을 붙여넣는다
```

## 한 줄

> 배포가 초록불인데 페이지가 없으면 `hugo list future` 부터. 손으로 적은 시각은 미래로 샌다.
