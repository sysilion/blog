---
title: "git log --follow --reverse 는 커밋 하나만 뱉는다"
date: 2026-09-10T10:40:00+09:00
draft: false
tags: ["git", "삽질"]
summary: "파일 이력을 오래된 순으로 훑으려고 --follow 와 --reverse 를 같이 줬더니 29개 커밋 중 1개만 나왔다."
---

## 무슨 일이

주간 갱신 커밋이 쌓인 `data/map_data.json` 의 이력을 훑어 매장별 최초 등장일을 복원하려 했다.
오래된 순으로 받으려고 `--reverse` 를, 경로 변경을 따라가려고 `--follow` 를 같이 줬다.

```bash
git log --reverse --follow --date=short --format='%H %ad' -- data/map_data.json
```

29개 커밋이 나와야 하는데 **1개만** 나왔다. 그 1개는 가장 오래된 커밋이라 "다 나온 것처럼" 보이기도 해서
한참 뒤에야 이상하다는 걸 알았다.

## 원인

`--follow` 는 [[git-log-follow]] 항목대로 파일을 한 번에 하나씩만 추적하는 특수 모드다.
git 내부적으로 커밋을 스트림으로 흘려보내며 이름 변경을 따라가는데, `--reverse` 는 그 스트림을
끝까지 모은 뒤 뒤집어야 한다. 두 옵션이 서로의 전제를 깨서, 결과가 첫 커밋에서 잘린다.

`git log --help` 의 `--follow` 설명에도 "works only for a single file" 이라는 제약만 있고
`--reverse` 와의 상호작용은 적혀 있지 않다.

## 재현

```bash
$ git --version
git version 2.55.0

$ git log --follow --format='%h' -- data/map_data.json | wc -l
      29
$ git log --reverse --follow --format='%h' -- data/map_data.json | wc -l
       1
$ git log --reverse --format='%h' -- data/map_data.json | wc -l
      28        # --follow 를 빼면 --reverse 는 정상 동작한다
```

`--follow` 를 뺀 28개와 붙인 29개의 차이가 이름이 바뀌기 전 커밋이다.
`--reverse` 를 얹는 순간 그 29개가 1개로 줄어든다.

## 그래서

`--follow` 로 최신순 목록을 받아 **호출하는 쪽에서 뒤집는다.**

```python
rows = git("log", "--follow", "--date=short", "--format=%H\t%ad", "--", path).splitlines()
rows.reverse()
```

## 한 줄

`--follow` 를 쓸 거면 정렬은 git 에 맡기지 말고 직접 하자.
