---
title: "serde 컨테이너 default 안에서 Default를 역직렬화로 만들면 스택이 터진다"
date: 2026-11-04T03:25:26+09:00
draft: false
tags: ["rust", "serde"]
summary: "#[serde(default)] 구조체의 Default 구현이 toml::from_str 을 부르면 무한 재귀"
---

## 무슨 일이

padpilot 설정 구조체에 `#[serde(default)]` 를 붙이고, `impl Default` 는 내장 TOML을 파싱해서 만들게 했다. 테스트에서 `Config::default()` 를 부르자 `has overflowed its stack` 으로 죽었다. 빌드 경고는 없었다.

## 원인

구조체에 붙인 [[serde-default]] 는 빠진 필드만 채우는 게 아니다. 역직렬화를 시작할 때 `Default::default()` 로 구조체 전체를 먼저 만들고, 입력에 있는 필드로 덮어쓴다. TOML에 모든 필드가 들어 있어도 이 호출은 일어난다. 그래서 `default()` → `from_str()` → `default()` 가 끝없이 돈다.

## 재현

```rust
#[derive(serde::Deserialize, Debug)]
#[serde(default)]
struct Cfg { a: u32 }

impl Default for Cfg {
    fn default() -> Self { toml::from_str("a = 1").unwrap() }
}

fn main() { println!("{:?}", Cfg::default()); } // stack overflow
```

## 그래서

`Default` 는 derive로 두고(빈 값), 내장 설정 파싱은 `Config::builtin()` 같은 별도 함수로 뺐다.

## 한 줄

`#[serde(default)]` 를 단 타입의 `Default` 에서는 그 타입을 역직렬화하지 않는다. 내장 설정이 필요하면 다른 이름의 생성자를 만든다.
