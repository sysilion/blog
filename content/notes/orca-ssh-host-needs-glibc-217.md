---
title: "Orca SSH 호스트는 glibc 2.17 미만이면 붙지 않는다 — CentOS 6은 탈락"
date: 2026-10-21T00:05:26+09:00
draft: false
tags: ["orca", "ssh", "linux", "glibc"]
summary: "Orca는 원격 호스트에 Node 24를 직접 올린다. 기본선은 glibc 2.28, x64만 2.17까지 호환 빌드로 내려간다. CentOS 6.10(glibc 2.12)은 고를 런타임이 없다."
---

## 무슨 일이

CentOS 6.10 서버를 Orca SSH 호스트로 쓸 수 있는지 확인해야 했다. 공식 문서에서 최소 사양을 찾지 못해
Orca 1.4.232 앱 번들(`app.asar`)을 풀어 원격 런타임을 고르는 코드를 직접 읽었다.

## 원인

Orca는 SSH 호스트에 설치된 Node를 쓰지 않는다. 자기가 고정한 **Node 24.21.0** 바이너리를 호스트에 올리고
그 위에서 relay와 [[orca-managed-server|orcad]]를 띄운다. 그래서 호스트 조건은 결국
"이 Node 바이너리가 돌 수 있는가"이고, Linux에서는 [[glibc]] 버전이 기준이 된다.

호스트 판별 → 런타임 선택 순서:

1. `uname -m` 으로 아키텍처를 확인한다. x64/arm64만 대상이다.
2. `ldd --version` 이나 `getconf GNU_LIBC_VERSION` 으로 glibc 버전을 읽는다. 실패하면 `/lib/ld-musl-*.so.1` 이 있는지로 [[musl]]을 판별한다.
3. glibc 버전을 기준과 비교한다.

| 호스트 | 런타임 |
| --- | --- |
| glibc ≥ 2.28 (x64·arm64) | 공식 Node 빌드 |
| x64, 2.17 ≤ glibc < 2.28 | 비공식 호환 빌드 `linux-x64-glibc217` |
| arm64, glibc < 2.28 | **없음** |
| glibc < 2.17 | **없음** |
| musl (x64·arm64) | musl 빌드 |
| macOS | 13.5 이상 |
| Windows | relay만 됨. 상주 `orcad` 는 POSIX 호스트에서만 |

번들의 선택 로직(난독화된 이름 그대로):

```js
var Ri={major:2,minor:28},
    zi=[{runtimeTarget:`linux-x64-glibc217`, hostTarget:..., glibcFloor:{major:2,minor:17}}];
function Vi(e){let{glibc:t}=e;
  return t===null||!Bi(t,Ri) ? e.target
       : zi.find(n=>n.hostTarget===e.target&&!Bi(t,n.glibcFloor))?.runtimeTarget ?? null}
```

2.28 미만이면 호환 목록에서 찾고, 거기에도 맞는 항목이 없으면 `null` 이다. CentOS 6.10의 glibc는 2.12다.

## 재현

호스트 쪽에서 확인:

```bash
$ uname -m
x86_64
$ getconf GNU_LIBC_VERSION
glibc 2.12          # CentOS 6.10 → 2.17 미만, 탈락
```

번들에서 기준값 확인:

```bash
mkdir -p /tmp/orca-asar && cd /tmp/orca-asar
npx -y @electron/asar extract /Applications/Orca.app/Contents/Resources/app.asar .
grep -n "glibc217\|DARWIN_MINIMUM_OS" out/shared/node-runtime-pin.js
grep -o 'var Ri={major:2,minor:28}.\{0,200\}' out/main/chunks/orcad-managed-serving-*.js
```

## 그래서

- CentOS 7(glibc 2.17)은 x64에서만 호환 빌드로 붙는다. Rocky/Alma 8 이상(glibc 2.28)이면 기본 지원이다.
- CentOS 6 같은 옛 서버는 Orca 호스트로 쓰지 않는다. 지원되는 Linux 머신을 Orca 호스트로 두고, 그 터미널에서 `ssh` 로 한 번 더 들어간다.
- 위 기준은 앱 버전마다 바뀔 수 있다. Node 고정 버전이 바뀌면 같이 움직이니, 업데이트 후에는 `node-runtime-pin.js` 를 다시 본다.

## 한 줄

> Orca SSH 호스트의 최소 사양은 결국 "Orca가 가져온 Node 24가 거기서 도느냐"이고, Linux에서는 glibc 버전으로 갈린다.
