---
title: "수동 항목을 추가해도 이미 저장된 자동 항목은 살아남아 타임라인에 두 번 그려졌다"
date: 2026-09-30T02:51:45+09:00
draft: false
tags: ["python", "subculture-timeline", "data-merge"]
summary: "merge가 fresh 쪽 중복만 걸러서, 먼저 저장된 _auto 항목이 수동 항목과 같은 키로 공존했다"
---

## 무슨 일이

subculture-timeline 명조(wuwa) 행에 'Matrix Reform' 이벤트가 같은 기간으로 두 개 그려졌다. 하나는 수동 작성, 하나는 `_auto: true`.

## 원인

`scripts/update_data.py` 의 `merge_entries` 는 수동 항목을 만나면 **새로 파싱한(fresh)** 자동 항목에서만 같은 키를 pop 했다.
수동 항목이 추가되기 **전에** 이미 games.json 에 저장돼 있던 자동 항목은 "기존 자동 항목" 경로를 타서 90일 이내면 그대로 유지됐다. [[멱등성|idempotent]] 하게 설계됐지만 시간 순서에 따라 결과가 달라진 것.

## 재현

```bash
python3 -c "
import json;d=json.load(open('data/games.json'))
for g in d['games']:
    mk={f\"{e.get('title','')}|{e.get('start','')}\" for e in g['entries'] if not e.get('_auto')}
    print(g['id'],sum(1 for e in g['entries'] if e.get('_auto') and f\"{e.get('title','')}|{e.get('start','')}\" in mk))"
```

## 그래서

수동 항목 키 집합을 먼저 만들고, 기존 자동 항목이 그 키를 가지면 버리도록 고쳤다. 데이터에 이미 들어 있던 중복 3건도 지웠다. (commit a5eaed9)

## 한 줄

병합 dedupe 는 "새로 들어오는 쪽"만이 아니라 "이미 있는 쪽"에도 같은 규칙을 적용해야 순서 독립적이다.
