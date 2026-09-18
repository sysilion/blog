---
title: "adb 포트 스캔이 남긴 offline 항목 하나가 모든 명령을 빈 문자열로 만든다"
date: 2026-09-18T16:35:00+09:00
draft: false
tags: ["android", "adb"]
summary: "adb가 아닌 포트에 붙으면 offline 항목이 남고, devices()가 비면서 시리얼 없는 명령이 조용히 실패한다"
---

## 무슨 일이

무선 디버깅은 **포트가 계속 바뀐다.** 재부팅은 물론 토글만 해도 바뀌어서, 하루 한 번
도는 예약 작업이 어제 포트를 그대로 쓰면 그날은 통째로 실패한다. 그래서 마지막으로
붙었던 호스트의 포트를 훑어 다시 붙게 했다 — 2만 개를 3초에 훑는다.

그런데 그 뒤로 출석체크 네 개가 전부 이렇게 끝났다.

```
✗ 우리동네GS: 실패 (1초)   화면이 꺼져 있거나 잠겨 있습니다
✗ 포켓CU:     실패 (1초)   화면이 꺼져 있거나 잠겨 있습니다
```

폰 화면은 켜져 있었다.

## 원인

`adb devices` 를 보니 항목이 둘이었다.

```
100.66.206.67:36509    offline
100.66.206.67:38211    offline
```

스캔은 **열려 있는 포트면 뭐든** 붙는다. `36509` 는 adb 가 아니라 페어링 포트였고,
붙긴 붙었지만 명령을 못 받는 껍데기로 남았다.

여기서부터 연쇄가 시작된다.

1. `adb devices` 에서 `device` 상태인 게 없으니 목록은 **비어 있다**
2. 그래서 쓸 시리얼을 못 고르고 `-s` 없이 명령이 나간다
3. 항목은 둘이므로 adb 가 `more than one device` 로 거부한다
4. 그 오류는 **stderr** 로 가고 **stdout 은 빈 문자열**이다
5. `dumpsys` 결과를 문자열로 받아 판정하는 코드는 그 공백을 '답' 으로 읽는다

```python
out = adb("shell", "dumpsys", "window")        # ""
if "mShowingLockscreen=true" in out: ...       # False — '안 잠김' 으로 읽힌다
```

같은 공백이 어떤 함수에서는 '잠겨 있다', 다른 함수에서는 '안 잠겼다' 가 된다.
같은 폰을 두고 판정이 실행마다 달랐던 이유다.

## 재현

```bash
adb connect <폰IP>:<adb가 아닌 열린 포트>
adb devices          # offline 항목이 생긴다
adb shell echo hi    # adb: more than one device/emulator  (stdout 은 비어 있다)
```

## 그래서

**붙었다고 쓸 수 있는 게 아니다.** 실제로 명령을 받는지 확인하고, 아니면 떼어낸다.

```python
subprocess.run(["adb", "connect", target])
if target in devices() and alive(target):     # adb -s <t> shell echo ok
    return target
subprocess.run(["adb", "disconnect", target])
```

그리고 **빈 덤프를 답으로 읽지 않는다.** 읽을 수 없었다는 것과 그렇지 않다는 것은
다르다. 구분하지 않으면 엉뚱한 진단이 나온다.

```python
if not out and not power:
    raise AdbError("기기가 응답하지 않습니다 (dumpsys 가 비어 있음)")
```

## 한 줄

`adb` 의 오류는 stderr 로 가고 stdout 은 빈다. 빈 결과를 사실로 읽으면 진단이 통째로 틀어진다.
