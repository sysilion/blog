---
title: "TAURI_SIGNING_PRIVATE_KEY_PATH를 줬는데 개인키가 없다고 한다"
date: 2026-09-12T03:50:00+09:00
draft: false
tags: ["tauri", "빌드", "삽질"]
summary: "빌드는 _PATH 변수를 보지 않는다. 키 내용을 TAURI_SIGNING_PRIVATE_KEY에 직접 넣어야 한다."
---

## 무슨 일이

[[tauri|Tauri]] v2 업데이터를 붙이고 서명된 릴리스를 구우려 했다.
`tauri signer generate` 가 알려 준 대로 환경 변수를 줬다.

```sh
TAURI_SIGNING_PRIVATE_KEY_PATH=~/.deskmate/updater.key \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD= \
npm run tauri build
```

번들은 다 만들어진다. `.app`, `.dmg`, `.app.tar.gz` 까지 나온다. 그리고 **맨 마지막에**
실패한다.

```
A public key has been found, but no private key.
Make sure to set `TAURI_SIGNING_PRIVATE_KEY` environment variable.
       Error A public key has been found, but no private key.
```

## 원인

`signer generate` 가 출력하는 안내문에는 세 변수가 나란히 적혀 있다.

```
- `TAURI_SIGNING_PRIVATE_KEY`: String of your private key
- `TAURI_SIGNING_PRIVATE_KEY_PATH`: Path to your private key file
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
```

그런데 `_PATH` 는 `tauri signer sign` 하위 명령이 읽는 것이고, **`tauri build` 의 서명
단계는 `TAURI_SIGNING_PRIVATE_KEY` 하나만 본다.** 안내문이 세 개를 함께 보여 주니
어느 명령의 것인지 구분이 안 된다.

오류가 번들을 다 만든 **뒤에** 나오는 것도 헷갈린다. `.tar.gz` 까지 손에 쥐고 있는데
`.sig` 만 없다.

## 재현

```sh
# 실패 — 번들은 나오고 .sig 만 없다
TAURI_SIGNING_PRIVATE_KEY_PATH=~/.deskmate/updater.key npm run tauri build

# 성공
TAURI_SIGNING_PRIVATE_KEY="$(cat ~/.deskmate/updater.key)" \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD= \
npm run tauri build
```

성공하면 로그 끝에 한 줄이 더 붙는다.

```
    Finished 1 updater signature at:
        .../bundle/macos/deskmate.app.tar.gz.sig
```

## 그래서

키 **내용**을 넣는다. 비밀번호 없이 만든 키라면 `..._PASSWORD` 를 빈 문자열로라도 주어야
프롬프트가 뜨지 않는다. CI라면 키 내용을 시크릿에 넣는 것이 어차피 자연스럽다.

`.sig` 가 없으면 `latest.json` 의 `signature` 를 채울 수 없고, 업데이터는 서명이 맞는
패키지만 설치하므로 업데이트가 통째로 동작하지 않는다.

## 한 줄

빌드에 쓰는 건 `TAURI_SIGNING_PRIVATE_KEY` 하나다. `_PATH` 는 `signer sign` 전용이다.
