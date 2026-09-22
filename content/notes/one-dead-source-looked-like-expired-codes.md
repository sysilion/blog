---
title: "소스 한 곳이 잠깐 죽자 수집기가 코드를 만료로 지웠다"
date: 2026-09-22T18:08:12+09:00
draft: false
tags: ["크롤링", "python", "데이터"]
summary: "'소스에 없으면 만료'라는 규칙은 소스가 응답했을 때만 참이다"
---

## 무슨 일이

subculture-timeline에 게임별 리딤 코드 수집기를 붙였다. 스타레일은 두 소스(`hoyo-codes.seria.moe` API와
`pockettactics.com`)를 합쳐 11개가 나왔는데, 몇 분 뒤 다시 돌리니 `codes.json` 에 8개만 남아 있었다.
사라진 3개는 모두 API 쪽에만 있던 코드였다.

## 원인

병합 규칙이 이랬다.

```python
# 이번에 수집된 목록에 없는 자동 코드는 만료로 보고 버린다
out = [c for c in fresh]
out += [c for c in existing if not c.get("_auto")]
```

두 번째 실행에서 API가 일시적으로 실패했다. 예외는 잡아 로그만 남기고 넘어가도록 해 둔 터라,
남은 소스(pockettactics)의 결과만으로 `fresh` 가 만들어졌다. 그 결과 **응답조차 하지 않은 소스의 코드가
"소스에서 사라진 코드"와 구별되지 않았다.** 만료 판정의 전제 — 소스가 목록 전체를 돌려줬다 — 가 깨진 것이다.

## 재현

```bash
python3 scripts/update_codes.py
python3 -c "import json;d=json.load(open('data/codes.json'));print(len(d['games']['starrail']['codes']))"
# 소스 하나를 죽이고(URL 오타·타임아웃) 다시 실행하면 그 소스의 코드만 통째로 빠진다
```

## 그래서

수집 단계에서 **이번 실행에 응답한 소스 이름**을 같이 돌려주고, 병합에서 그 집합을 기준으로 판단한다.

```python
def merge(existing, fresh, today, answered: set[str]):
    ...
    for c in existing:
        if c["code"].upper() in seen:
            continue
        # 손으로 넣은 코드, 그리고 이번에 응답하지 않은 소스의 코드는 남긴다
        if not c.get("_auto") or c.get("source") not in answered:
            out.append(c)
```

코드마다 `source` 를 기록해 둔 게 여기서 값을 했다. 출처가 없으면 "누가 책임지는 항목인지"를
되물을 수 없어 이 구분이 불가능하다.

## 한 줄

삭제 판정은 "없다"가 아니라 **"있다고 말할 수 있는 소스가 답했는데 없다"** 여야 한다.
