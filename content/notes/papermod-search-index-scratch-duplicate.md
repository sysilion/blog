---
title: "hugo server 에서만 검색 결과가 계속 늘어난다 — PaperMod의 .Scratch"
date: 2026-08-27T15:10:00+09:00
draft: false
tags: ["hugo", "papermod", "go-template"]
summary: "index.json 이 .Scratch 로 쌓여서, 증분 리빌드마다 같은 글이 한 번씩 더 붙는다. 프로덕션 빌드는 멀쩡하다."
aliases: ["/wiki/papermod-search-index-scratch-duplicate/"]
---

## 무슨 일이

위키 섹션을 붙이고 로컬에서 검색을 확인하는데, 결과가 두 배로 나왔다.
새로고침할수록 늘어났다. 글은 2개인데 인덱스는 4개, 그 다음엔 12개.

## 원인

[[papermod]]의 `layouts/index.json` 은 [[hugo-scratch|.Scratch]] 에 결과를 누적한다.

```go-html-template
{{- $.Scratch.Add "index" slice -}}
{{- range site.RegularPages -}}
    {{- $.Scratch.Add "index" (dict "title" .Title ...) -}}
{{- end -}}
{{- $.Scratch.Get "index" | jsonify -}}
```

`Scratch` 는 **페이지에 붙어 살아남는다.** `hugo server` 의 증분 리빌드는 페이지 객체를 재사용하므로
템플릿이 다시 돌 때 이전 내용이 그대로 남아 있고, 거기에 한 벌이 더 얹힌다.
첫 줄 `$.Scratch.Add "index" slice` 는 초기화가 아니라 **빈 슬라이스를 덧붙이는 것**이라 지워주지도 않는다.

## 재현

```bash
$ hugo --destination /tmp/pub          # 프로덕션 1회 빌드
$ jq length /tmp/pub/index.json
2                                       # 정상

$ hugo server -D &
$ curl -s localhost:1313/blog/index.json | jq length
2
# 파일 몇 번 고쳐서 리빌드 유발
$ curl -s localhost:1313/blog/index.json | jq length
12                                      # 리빌드 6회 = 6배
```

프로덕션 배포는 매번 새 프로세스가 1회 빌드하므로 **증상이 로컬에서만 보인다.**

## 그래서

`layouts/index.json` 으로 테마 템플릿을 덮어쓰고 `Scratch` 를 걷어냈다. 지역 변수 + `append` 면 끝난다.

```go-html-template
{{- $index := slice -}}
{{- range site.RegularPages -}}
    {{- if and (not .Params.searchHidden) (ne .Layout `archives`) (ne .Layout `search`) -}}
        {{- $index = $index | append (dict "title" .Title "content" .Plain "permalink" .Permalink "summary" .Summary) -}}
    {{- end -}}
{{- end -}}
{{- $index | jsonify -}}
```

리빌드를 몇 번 돌려도 2로 고정됐다.

## 한 줄

> [[hugo]] 템플릿에서 누적이 필요하면 `.Scratch` 말고 `$x = $x | append`. `.Scratch` 의 수명은 빌드가 아니라 페이지다.
