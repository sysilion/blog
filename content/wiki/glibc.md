---
title: "glibc"
date: 2026-10-21T00:05:26+09:00
draft: false
tags: ["linux", "libc"]
summary: "GNU C 라이브러리. 대부분의 Linux 배포판이 쓰는 표준 C 라이브러리이며, 미리 빌드된 바이너리가 어느 배포판에서 도는지를 이 버전이 정한다."
altnames: ["GNU C Library", "libc6"]
---

**glibc**(GNU C Library)는 GNU 프로젝트의 C 표준 라이브러리 구현이다. Debian·Ubuntu·RHEL 계열 등 대부분의 Linux 배포판이 쓴다.

## 무엇인가

- `printf`, `malloc` 같은 C 표준 함수와 POSIX API, 시스템 콜 래퍼, 동적 링커(`ld-linux*.so`)를 제공한다.
- 거의 모든 동적 링크 바이너리가 여기에 의존한다.
- 심볼에 버전이 붙는다(`GLIBC_2.28` 등). 바이너리는 **빌드한 환경의 glibc보다 낮은 glibc에서는 돌지 않는다.** 반대로 높은 쪽에서는 돈다(하위 호환).

## 알아둘 것

- 확인 방법:
  ```bash
  getconf GNU_LIBC_VERSION   # glibc 2.28
  ldd --version | head -1
  ```
- 배포판별 대략값: CentOS 6 = 2.12, CentOS 7 = 2.17, RHEL/Rocky 8 = 2.28, Ubuntu 20.04 = 2.31, Ubuntu 22.04 = 2.35.
- 배포판의 glibc만 따로 올리는 일은 사실상 하지 않는다. 시스템 전체가 여기에 묶여 있다.
- Alpine은 glibc가 아닌 [[musl]]을 쓴다. glibc용 바이너리는 Alpine에서 그대로 돌지 않는다.
- 배포 바이너리의 최소 glibc를 낮추려면 오래된 배포판(예: CentOS 7)에서 빌드한다. manylinux 같은 규격이 이 방식을 쓴다.
