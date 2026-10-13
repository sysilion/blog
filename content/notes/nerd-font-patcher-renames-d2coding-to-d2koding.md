---
title: "Nerd Fonts font-patcher로 D2Coding을 패치하면 이름이 D2Koding이 된다"
date: 2026-10-13T12:31:33+09:00
draft: false
tags: ["nerd-fonts", "font", "license"]
summary: "D2Coding 1.4.0을 직접 패치하니 결과물 이름이 'D2Koding Nerd Font'. OFL 예약 폰트명 때문이다."
---

## 무슨 일이

Nerd Fonts 공식 배포본의 D2Coding은 아직 1.3.2(2018)다. 2026-10 나온 D2Coding 1.4.0을
`font-patcher`(v3.5.1)로 직접 패치했더니 결과물 패밀리명이 `D2Coding Nerd Font`가 아니라
`D2Koding Nerd Font` / `D2KodingLigature Nerd Font` 였다.

## 원인

D2Coding의 라이선스는 [[ofl|SIL OFL]]이고, `OFL.txt`에 **Reserved Font Name D2Coding** 이 선언돼 있다.
수정본(Modified Version)은 [[reserved-font-name]]을 쓸 수 없으므로 font-patcher가 이름을 바꾼다.
규칙은 `bin/scripts/name_parser/FontnameTools.py` 에 하드코딩돼 있다.

```python
( '(d2)( ?)coding(.*)',         r'\1\2Koding\3' ),
```

Cascadia Code → CaskaydiaCove 등 다른 RFN 폰트도 같은 표로 바뀐다.

반면 Nerd Fonts **공식 릴리스**(3.4.0)에 든 D2Coding은 패밀리명이 `D2CodingLigature Nerd Font` 그대로다.
직접 패치한 것과 공식 배포본은 이름이 달라서 둘 다 설치하면 별개 폰트로 잡힌다.

## 재현

```bash
brew install fontforge
curl -LO https://github.com/ryanoasis/nerd-fonts/releases/download/v3.5.1/FontPatcher.zip && unzip FontPatcher.zip -d patcher
gh release download VER1.4.0 -R naver/d2-coding-font && unzip D2Coding-Ver1.4.0-*.zip
# 공식 D2Coding config.cfg 와 동일하게 --xavgcharwidth 500
fontforge -script patcher/font-patcher --complete --xavgcharwidth 500 -out out \
  D2CodingLigature/D2Coding-Ver1.4.0-20261003-ligature.ttf
ls out   # D2KodingLigatureNerdFont-Regular.ttf
```

1.4.0의 `cv01`/`ss01`(점 있는 0) GSUB 피처와 한글 글리프는 패치 후에도 그대로 남는다.

## 그래서

에디터·터미널 폰트 설정에는 `D2Coding Nerd Font`가 아니라 **`D2Koding Nerd Font`** 로 적어야 한다.
`--makegroups -1` 로 원래 이름을 유지할 수는 있지만 RFN 위반이라 재배포하면 안 된다.

## 한 줄

OFL 예약 폰트명이 걸린 폰트는 패치하면 이름이 바뀐다. 못 찾겠으면 철자를 의심하라.
