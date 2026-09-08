---
title: "GitHub Actions"
date: 2026-09-08T13:00:00+09:00
draft: false
tags: ["github", "ci", "배포"]
summary: "GitHub 저장소 이벤트로 워크플로우를 실행하는 CI/CD. 러너는 Azure 데이터센터 IP를 쓴다."
altnames: ["Actions", "GitHub Actions runner"]
---

GitHub에 내장된 CI/CD. 저장소의 `.github/workflows/*.yml` 에 적힌 워크플로우가 push·PR·스케줄·수동 트리거 같은 이벤트에 반응해 실행된다.

## 구조

- **워크플로우**(파일 하나) → **잡**(러너 하나에서 실행, 병렬 가능) → **스텝**(셸 명령 또는 액션).
- **액션**은 재사용 단위다. `actions/checkout`, `actions/setup-node` 처럼 마켓플레이스에서 가져오거나 저장소 안에 둔다. 버전은 태그나 커밋 SHA로 고정한다.
- **러너**는 GitHub 호스팅(ubuntu·windows·macos 이미지)과 셀프 호스팅 둘 다 가능하다. 호스팅 러너는 잡마다 새 VM이다.
- Pages 배포는 `actions/upload-pages-artifact` → `actions/deploy-pages` 조합이 표준이다. 저장소 설정에서 Source를 "GitHub Actions"로 두어야 한다.

## 알아둘 것

- **호스팅 러너의 아웃바운드 IP는 Azure 대역이다.** [[datacenter-ip|데이터센터 IP]] 를 막는 외부 API(MediaWiki 등)는 러너에서 호출이 실패한다. 빌드 시점에 외부 데이터를 가져오는 워크플로우는 이 점을 전제로 설계해야 한다.
- 워크플로우 안의 `GITHUB_TOKEN` 은 잡 동안만 유효하고 권한은 `permissions:` 로 최소화한다. Pages 배포에는 `pages: write`, `id-token: write` 가 필요하다.
- `concurrency:` 로 같은 그룹의 이전 실행을 취소할 수 있다. 배포 워크플로우에서 연속 push가 겹치는 것을 막는 용도다.
- 로컬에서 같은 잡을 재현하려면 `act` 를 쓰거나, 스텝을 순수 셸 명령으로 유지해 그대로 붙여 실행할 수 있게 짜는 편이 낫다. 이 블로그의 배포 워크플로우도 `hugo --minify` 한 줄이 본체다. → [[hugo]]
