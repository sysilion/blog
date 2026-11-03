---
title: "serde(default)"
date: 2026-11-04T03:25:26+09:00
draft: false
tags: ["rust", "serde"]
summary: "역직렬화 입력에 없는 값을 Default 로 채우게 하는 serde 속성"
altnames: ["#[serde(default)]", "serde default"]
---

`#[serde(default)]` 는 입력에 빠진 값을 `Default::default()` 로 채우게 하는 serde 속성이다.

## 붙이는 위치에 따라 다르다

- **필드에 붙이면** 그 필드가 입력에 없을 때만 필드 타입의 `Default` 를 부른다. `#[serde(default = "path")]` 로 함수를 지정할 수도 있다.
- **구조체(컨테이너)에 붙이면** 역직렬화 시작 시 구조체 전체의 `Default::default()` 를 한 번 부르고, 입력에 있는 필드만 덮어쓴다. 입력이 모든 필드를 갖고 있어도 호출된다.

## 알아둘 것

- 컨테이너 default를 쓰려면 그 구조체가 `Default` 를 구현해야 한다. 필드 단위 default와 섞으면 필드 쪽이 우선한다.
- 컨테이너의 `Default` 구현 안에서 같은 타입을 역직렬화하면 무한 재귀가 된다. 컴파일러는 잡아 주지 않는다.
