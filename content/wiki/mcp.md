---
title: "MCP"
date: 2026-09-08T11:50:00+09:00
draft: false
tags: ["ai", "프로토콜"]
summary: "LLM 애플리케이션이 외부 도구·데이터에 붙는 표준 프로토콜. Model Context Protocol."
altnames: ["Model Context Protocol"]
---

LLM 애플리케이션(호스트)이 외부 도구·자원·프롬프트를 표준화된 방식으로 발견하고 호출하게 하는 개방형 프로토콜. Anthropic이 2024년 11월 공개했다.

## 구조

- **호스트/클라이언트**: Claude Desktop, Claude Code, IDE 같은 LLM 앱. 서버에 연결해 기능 목록을 받는다.
- **서버**: 도구(tools), 자원(resources), 프롬프트(prompts)를 노출하는 프로세스. 파일시스템, DB, 브라우저, Blender 등 무엇이든 감쌀 수 있다.
- **전송**: 로컬은 stdio, 원격은 HTTP(SSE / Streamable HTTP). 메시지는 JSON-RPC 2.0.

서버 하나를 만들면 어떤 호스트에서도 쓸 수 있다는 점이 핵심이다. 도구 통합이 N×M에서 N+M이 된다.

## 알아둘 것

- 도구 설명(description)이 그대로 모델 프롬프트에 들어간다. 서버가 늘면 컨텍스트를 먹으므로 호스트들은 도구 스키마를 지연 로딩하기도 한다.
- 서버는 호스트 권한으로 실행되는 코드다. 출처 불명 서버는 공급망 위험이다.
- 에이전트가 GUI 애플리케이션을 조작하는 접점으로도 쓰인다. [[blender-mcp]]가 그 예다.
