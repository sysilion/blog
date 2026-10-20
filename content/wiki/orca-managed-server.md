---
title: "Orca 관리 서버"
date: 2026-10-20T11:20:16+09:00
draft: false
tags: ["orca", "ssh", "remote"]
summary: "SSH 호스트에서 orcad가 직접 돌며 그 호스트의 프로젝트·그룹·폴더 워크스페이스를 소유하는 Orca 실행 방식."
altnames: ["managed server", "orca managed server", "orcad", "paired server"]
---

**Orca 관리 서버**(managed server)는 SSH 호스트 위에서 Orca 런타임(`orcad`)을 직접 띄우고,
데스크톱은 그 서버에 페어링된 클라이언트로 붙는 방식이다.

## 구조

- 데스크톱은 SSH 타깃(`ssh-<id>`)을 **환경(environment)** 으로 옮긴다(migration). 기록은
  `~/Library/Application Support/orca/orcad-migration-cutovers/<id>.json` 에 남는다.
- 옮긴 뒤에는 그 호스트의 프로젝트(`repos`), 프로젝트 그룹, 폴더 워크스페이스를 **서버가 소유**한다.
  데스크톱 DB(`profiles/<profile>/profile-state.db`)에는 옮기기 전 사본만 `sourceRetained` 로 남는다.
- 사이드바는 모든 호스트의 그룹을 한 목록으로 모아 그린다. 같은 id의 사본이 두 호스트에 있으면 한 번만 그린다.

## 알아둘 것

- 그룹 소속은 프로젝트 행의 `projectGroupId` 이고, 그룹은 **한 호스트의 카탈로그에만** 산다.
  다른 호스트의 그룹에는 넣을 수 없다 (stablyai/orca#30127).
- 데스크톱 DB를 고쳐도 서버가 소유한 프로젝트 화면은 바뀌지 않는다. 확인은
  `orca repo list --environment <이름> --json` 으로 한다.
- 같은 폴더 워크스페이스나 그룹이 두 호스트에 다 있으면(twin), 호스트를 지정하지 않은 동작은
  추측하지 않고 거부된다 (stablyai/orca#30009).
