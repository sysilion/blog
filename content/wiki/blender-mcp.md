---
title: "BlenderMCP"
date: 2026-09-08T11:50:00+09:00
draft: false
tags: ["ai", "3d", "도구"]
summary: "LLM이 MCP로 Blender를 조작하게 하는 애드온 + 서버. 씬 조회·파이썬 실행·렌더가 도구로 노출된다."
altnames: ["blender-mcp", "Blender MCP"]
---

Blender 안에서 소켓 서버를 여는 애드온과, 그것을 [[mcp]] 도구로 감싸는 서버의 쌍. 오픈소스(ahujasid/blender-mcp). LLM 에이전트가 씬 정보를 읽고, 파이썬 코드를 실행해 오브젝트·재료·모디파이어를 바꾸고, 뷰포트 스크린샷을 받아볼 수 있다.

## 구조

```text
LLM 호스트 ──MCP(stdio)──► blender-mcp 서버 ──TCP 소켓──► Blender 애드온 (bpy 실행)
```

노출되는 도구는 대체로 씬/오브젝트 정보 조회, 임의 파이썬 실행, 뷰포트 캡처, 그리고 PolyHaven·Sketchfab·Hyper3D 같은 자산 소스 연동이다.

## 알아둘 것

- "임의 파이썬 실행"이 곧 능력이자 위험이다. 에이전트가 만든 코드가 그대로 돈다.
- 렌더 결과를 이미지로 돌려받을 수 있어, **렌더 → 검사 → 수정** 루프를 에이전트가 자율로 돌릴 수 있다. [[worldclaw]]의 지형·씬 정제 에이전트가 이 방식이다.
- Blender의 노드 기반 재료·지오메트리 워크플로우는 현세대 LLM이 코드로 정확히 짜기 어렵다는 관측이 반복된다. 단순 근사로 축소되기 쉽다.
