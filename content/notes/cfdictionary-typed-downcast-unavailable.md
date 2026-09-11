---
title: "CFDictionary는 타입을 붙이면 downcast가 안 된다"
date: 2026-09-11T16:15:00+09:00
draft: false
tags: ["rust", "macos", "core-foundation", "삽질"]
summary: "ConcreteCFType은 원시 CFDictionary에만 구현돼 있다. 타입 붙은 딕셔너리는 직접 감싸야 한다."
---

## 무슨 일이

`CGWindowListCopyWindowInfo`가 준 딕셔너리에서 `kCGWindowBounds`를 꺼내려 했다.
값이 또 딕셔너리(X/Y/Width/Height)라서 이렇게 썼다.

```rust
let rect = value(dict, unsafe { kCGWindowBounds })?
    .downcast::<CFDictionary<CFString, CFType>>()?;
```

```
error[E0277]: the trait bound `CFDictionary<CFString, CFType>: ConcreteCFType` is not satisfied
help: the trait `ConcreteCFType` is implemented for `CFDictionary`
```

## 원인

[[core-foundation]] 크레이트에서 `ConcreteCFType`은 **원시 형태에만** 구현돼 있다.

```rust
// core-foundation/src/dictionary.rs
unsafe impl ConcreteCFType for CFDictionary<*const c_void, *const c_void> {}
```

`CFDictionary<K, V>`는 키/값 타입만 얹은 얇은 껍데기라서, 제네릭 인자를 붙이는 순간
`downcast`가 요구하는 그 구현에서 벗어난다.

## 그래서

`downcast` 대신 포인터를 직접 감싼다. 바깥 딕셔너리를 만들 때 쓴 방법과 같다.

```rust
use core_foundation::dictionary::{CFDictionary, CFDictionaryRef};

let value = value(dict, unsafe { kCGWindowBounds })?;
let rect = unsafe {
    CFDictionary::<CFString, CFType>::wrap_under_get_rule(
        value.as_CFTypeRef() as CFDictionaryRef
    )
};
```

`wrap_under_get_rule`은 retain을 걸어 주므로 원본 `value`가 떨어져도 안전하다.

## 한 줄

CF 타입에서 `downcast`가 막히면, 타입 인자를 지운 형태만 `ConcreteCFType`인지 먼저 보자.
