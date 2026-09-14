---
title: "buildFuture"
date: 2026-09-15T03:57:39+09:00
draft: false
tags: ["hugo"]
summary: "date 가 빌드 시각보다 미래인 페이지를 낼지 결정하는 Hugo 설정. 기본값 false 라 조용히 빠진다."
altnames: ["build future", "hugo buildFuture", "미래 날짜 페이지"]
---

`buildFuture` 는 [[hugo]] 설정 키다. front matter 의 `date`(정확히는 `publishDate`)가
**빌드가 실행되는 순간보다 미래인 페이지를 출력에 포함할지** 결정한다. 기본값은 `false`.

```yaml
# hugo.yaml
buildFuture: false   # 기본값. 미래 날짜 페이지를 내지 않는다
```

`buildDrafts`(draft), `buildExpired`(expiryDate) 와 같은 계열이다.

## 알아둘 것

**제외는 경고 없이 일어난다.** 빌드는 정상 종료하고 exit code 0 이며, 로그에도 남지 않는다.
CI 는 초록불인데 페이지만 없다. 404 를 보고 나서야 알게 된다.

기준은 파일이 커밋된 시각도, 글을 쓴 시각도 아니라 **`hugo` 명령이 실행되는 시각**이다.
그래서 같은 파일이 어제 빌드에선 빠지고 오늘 빌드에선 나온다. 다음 배포가 사이트를 통째로
다시 만들면서 저절로 올라오기 때문에, 원인을 모른 채 "언젠가 뜨더라" 로 넘어가기 쉽다.

무엇이 걸렸는지는 빌드하지 않고도 볼 수 있다.

```bash
hugo list future     # date 가 미래라서 빠질 페이지를 CSV 로
hugo list drafts
hugo list expired
```

예약 발행은 이 설정을 `false` 로 둔 채 미래 날짜를 적고, 그 시각 이후에 빌드를 한 번 더
돌리는 식으로 만든다. `true` 로 바꾸면 예약이라는 개념 자체가 사라진다.
