---
title: "launchd"
date: 2026-10-24T19:32:27+09:00
draft: false
tags: ["macos", "scheduler"]
summary: "macOS의 init 겸 작업 스케줄러. plist 하나가 작업 하나다."
altnames: ["LaunchAgent", "LaunchDaemon", "StartCalendarInterval"]
---

launchd는 macOS에서 PID 1로 도는 프로세스로, 서비스를 띄우고 예약 작업을 실행한다. cron이 하던 일도 여기서 한다.

## 무엇인가

작업 하나가 plist 파일 하나다. 사용자 작업(LaunchAgent)은 `~/Library/LaunchAgents/`, 시스템 작업(LaunchDaemon)은 `/Library/LaunchDaemons/` 에 둔다.

| 키 | 뜻 |
| --- | --- |
| `StartCalendarInterval` | 달력 시각에 실행. crontab과 비슷하고 빠진 필드는 와일드카드 |
| `StartInterval` | N초마다 실행 |
| `RunAtLoad` | 작업이 로드될 때 한 번 실행. LaunchAgent는 로그인할 때 로드된다 |
| `EnvironmentVariables` | 실행 환경. 셸 프로필을 읽지 않으므로 `PATH` 를 직접 적는다 |

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/x.plist   # 등록
launchctl bootout   gui/$(id -u)/com.example.x                     # 해제
launchctl list | grep com.example                                   # PID, 마지막 종료코드
```

## 알아둘 것

- `StartCalendarInterval` 은 잠자기 중에 놓친 시각을 깨어날 때 한 번으로 합쳐 실행한다(`man launchd.plist`). cron과 다른 점이다.
- 전원이 꺼져 있었거나 재부팅 뒤 아직 로그인 전이라 LaunchAgent가 로드되지 않은 동안 놓친 시각은 실행되지 않는다. 문서에는 잠자기 경우만 적혀 있다.
- `StartInterval` 은 잠자기 중 놓친 회차를 그냥 버린다.
- FileVault가 켜져 있으면 재부팅 뒤 암호를 넣기 전까지는 macOS가 올라오지 않는다. 그 사이에는 LaunchDaemon도 돌지 않는다.
