---
title: "omp의 API 키는 설정 파일이 아니라 SQLite에 평문으로 들어 있다"
date: 2026-09-11T17:05:00+09:00
draft: false
tags: ["omp", "sqlite", "auth"]
summary: "config.yml을 아무리 뒤져도 키가 없다. ~/.omp/agent/agent.db의 auth_credentials 테이블이다. 암호화도 Keychain도 없다."
---

## 무슨 일이

[[omp]]가 Claude에 붙을 때 쓰는 자격증명이 어디 있는지 찾았다. `~/.omp/agent/config.yml` 에도
`models.yml` 에도 없다. `models.yml` 은 `auth: apiKey` 처럼 **방식만** 적고 값은 어디선가 가져온다.
프로젝트 디렉토리에도 없고, macOS Keychain에도 없다.

`agent.db` 안이었다.

## 원인

자격증명 저장소가 파일이 아니라 SQLite 테이블이다. 프로바이더가 수십 개라 키/토큰/만료/식별자를
같이 다뤄야 하고, 토큰 회전과 "더 새 자격증명으로 교체됨" 같은 상태 전이가 필요하니 테이블이 맞다.
대신 **행 값은 평문 JSON**이다.

```sql
CREATE TABLE auth_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  credential_type TEXT NOT NULL,   -- 'api_key' | 'oauth'
  data TEXT NOT NULL,              -- {"key":"..."} 또는 {"access":"...","refresh":"..."}
  disabled_cause TEXT DEFAULT NULL,
  identity_key TEXT DEFAULT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 재현

값을 안 뽑고 목록만 본다.

```bash
$ sqlite3 ~/.omp/agent/agent.db \
    "select provider, credential_type, length(data), coalesce(disabled_cause,'-')
     from auth_credentials order by id;"
google-antigravity|oauth|477|-
nvidia|api_key|80|-
openrouter|api_key|83|-
cloudflare-ai-gateway|api_key|63|replaced by newer credential
opencode-zen|api_key|77|-
google|api_key|63|-
anthropic|oauth|446|-
```

Keychain에는 없다.

```bash
$ security find-generic-password -s omp
security: SecKeychainSearchCopyNext: The specified item could not be found in the keychain.
```

`data` 를 그냥 `select` 하면 `sk-ant-oat01-…` 이 그대로 나온다.

## 그래서

- Claude 연동은 **API 키가 아니라 OAuth**였다. 구독 로그인이라 액세스 토큰과
  [[refresh-token|갱신 토큰]]이 한 행에 같이 들어 있다. `ANTHROPIC_API_KEY` 를 찾아 헤맨 게 헛수고.
- 환경변수가 DB보다 우선이다: `ANTHROPIC_OAUTH_TOKEN` → `ANTHROPIC_API_KEY` → DB.
  CI에서는 DB를 안 건드리고 환경변수만 꽂으면 된다.
- 교체된 키도 `disabled_cause` 만 붙고 **행은 남는다.** 옛 키가 디스크에 계속 있다.
- `agent.db` 는 백업·동기화(iCloud, Dropbox, dotfiles 저장소) 대상에서 빼야 한다.
  홈 디렉토리 통째로 백업하는 설정이면 키가 같이 넘어간다.

## 한 줄

**`~/.omp/agent/agent.db` 는 설정 DB가 아니라 자격증명 금고다. 평문이고, 지운 키도 남아 있다.**
