---
title: "Core Foundation"
date: 2026-09-11T16:15:00+09:00
draft: false
tags: ["macos", "c", "rust"]
summary: "Apple의 C 기반 공통 자료형 프레임워크. CFString, CFDictionary 같은 것들."
altnames: ["CoreFoundation", "CF", "core-foundation-rs"]
---

**Core Foundation**은 macOS·iOS의 C 수준 공통 자료형 프레임워크다.
`CFString`, `CFArray`, `CFDictionary`, `CFNumber` 같은 타입을 제공하고,
Objective-C의 `NSString`/`NSArray`/`NSDictionary`와 무비용으로 오간다(toll-free bridging).

Rust에서는 `core-foundation` 크레이트가 감싼다. `CGWindowListCopyWindowInfo` 같은
저수준 Quartz API가 CF 타입으로 결과를 주기 때문에, macOS 시스템 정보를 긁으려면 거의 반드시 지난다.

## 메모리 규칙

이름에 `Create`/`Copy`가 들어간 함수는 소유권을 넘긴다 → `wrap_under_create_rule`.
`Get`으로 받은 것은 빌린 것이다 → `wrap_under_get_rule` (retain을 걸어 준다).

## 알아둘 것

`ConcreteCFType`(= `downcast` 가능)은 **타입 인자 없는 원시 컨테이너에만** 구현돼 있다.
`CFDictionary<CFString, CFType>` 같은 형태는 `downcast` 대상이 아니라서,
`wrap_under_get_rule`로 직접 감싸야 한다.
