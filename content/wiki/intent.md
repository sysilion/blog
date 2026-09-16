---
title: "Intent"
date: 2026-09-16T13:22:00+09:00
draft: false
tags: ["android"]
summary: "안드로이드에서 '무엇을 해달라'를 담아 컴포넌트 사이를 오가는 메시지 객체"
altnames: ["인텐트", "android intent"]
---

안드로이드 컴포넌트(액티비티·서비스·브로드캐스트 수신자)를 부를 때 쓰는 메시지다.
"이 URL 을 보여달라", "이 사진을 공유해달라" 같은 요청을 담는다.

## 구조

로그와 `dumpsys` 에 찍히는 필드가 이렇게 대응한다.

| 필드 | 뜻 |
| --- | --- |
| `act=` | 액션. `android.intent.action.VIEW` 등 |
| `dat=` | 데이터 URI. 딥링크가 여기 들어간다 |
| `cmp=` | 목적지 `패키지/액티비티` |
| `cat=` | 카테고리. 런처 아이콘은 `android.intent.category.LAUNCHER` |
| `flg=` | 플래그 |

명시적 인텐트는 `cmp` 로 대상을 직접 지목하고, 암시적 인텐트는 `act`+`dat` 로 조건만
주고 시스템이 대상을 고른다. 딥링크는 후자다.

## 알아둘 것

- **로그에 찍힌 `dat=` 는 잘려 있다.** `toShortString()` 이 `Uri.toSafeString()` 을
  거치며 경로·쿼리를 지운다. 온전한 값은 `dumpsys activity activities` 에 있다.
- 한 앱이 화면을 전부 하나의 액티비티(웹뷰) 안에서 바꾸면 인텐트가 아예 안 생긴다.
  그런 앱은 딥링크로 특정 화면에 바로 들어갈 방법이 없다.
