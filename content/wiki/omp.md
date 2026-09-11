---
title: "omp"
date: 2026-09-11T17:00:00+09:00
draft: false
tags: ["cli", "llm", "agent"]
summary: "여러 LLM 프로바이더를 한 인터페이스로 묶는 터미널 코딩 에이전트 하네스. 설정과 자격증명을 ~/.omp 아래 둔다."
altnames: ["omp.sh", "Oh My Pi"]
---

터미널에서 도는 코딩 에이전트 하네스. Anthropic·OpenAI·Google·OpenRouter 등 **프로바이더를 바꿔 끼우는 것**이 전제다.

## 무엇인가

모델 하나에 묶이지 않는다. 역할(`default`, `task`, `smol`, `plan`, `vision` …)마다 다른 모델을 배정하고,
실패하면 다음 모델로 넘어가는 폴백 체인을 건다. 그래서 프로바이더마다 자격증명이 따로 필요하다.

## 설정 디렉토리

전부 홈 아래다. 프로젝트 안에는 아무것도 두지 않는다 (`.omp/secrets.yml` 은 예외).

| 경로 | 내용 |
| --- | --- |
| `~/.omp/agent/config.yml` | 역할별 모델 배정, 폴백 체인, UI 설정 |
| `~/.omp/agent/models.yml` | 커스텀 프로바이더의 baseUrl·인증 **방식** (값은 없다) |
| `~/.omp/agent/agent.db` | SQLite. `auth_credentials` 테이블에 **자격증명 평문** |
| `~/.omp/agent/secrets.yml` | 모델에게 가리고 싶은 값 (난독화 대상) |
| `~/.omp/logs/`, `~/.omp/run/` | 로그, 데몬·브라우저 런타임 상태 |

`PI_CONFIG_DIR` 로 위치를 옮길 수 있다.

## 자격증명 해석 순서

환경변수가 항상 DB보다 앞이다. Anthropic 기준:

```
ANTHROPIC_FOUNDRY_API_KEY   (CLAUDE_CODE_USE_FOUNDRY=true 일 때만)
  → ANTHROPIC_OAUTH_TOKEN
  → ANTHROPIC_API_KEY
  → agent.db 의 auth_credentials
```

`/login` 으로 붙인 구독 계정은 API 키가 아니라 OAuth 액세스·[[refresh-token|갱신 토큰]] 쌍으로 저장된다.

## 알아둘 것

- `agent.db` 는 암호화되지 않는다. macOS Keychain도 쓰지 않는다. 파일 권한에만 기댄다.
- 호스트에 토큰을 두고 싶지 않으면 auth broker 모드 (`OMP_AUTH_BROKER_URL`). 로컬 SQLite 저장소를
  통째로 우회하고 토큰을 브로커 호스트에 둔다.
- `secrets.enabled` 는 기본 꺼져 있다. 켜면 환경변수·`secrets.yml` 의 값이 모델에 가기 전에
  `$$HASH$$` 플레이스홀더로 치환된다. 이건 **프로바이더에게 가리는 것**이지 디스크 암호화가 아니다.
