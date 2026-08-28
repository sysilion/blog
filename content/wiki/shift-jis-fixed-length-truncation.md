---
title: "고정 길이 필드를 바이트로 자르면 멀티바이트가 반쪽 난다"
date: 2026-08-27T17:02:00+09:00
draft: false
tags: ["인코딩", "shift-jis", "바이너리", "python"]
summary: "VMD 본 이름 칸은 15바이트 Shift-JIS. 슬라이스로 자르면 마지막 글자가 깨진다."
---

## 무슨 일이

MMD 모션 파일(VMD)의 본 이름 칸은 **15바이트 고정**이고 인코딩은 Shift-JIS다.
`name.encode("shift_jis")[:15]`로 잘랐더니 이름이 깨졌다.

## 원인

Shift-JIS에서 한자·かな는 2바이트다. `左ひじ` 같은 이름을 15바이트에서 무심코 자르면
**마지막 글자의 첫 바이트만 남는다.** 디코더는 짝이 없는 선행 바이트를 만나 깨진 문자를 낸다.

UTF-8도 같은 문제지만 UTF-8은 바이트 경계를 알아볼 수 있어(선행 비트 패턴) 복구가 쉽다.
Shift-JIS는 그런 자기 동기화 성질이 약하다.

## 그래서

**글자 단위로 넣다가 넘치면 멈춘다.** 바이트 슬라이싱을 쓰지 않는다.

```python
raw = bytearray()
for ch in name:
    encoded = ch.encode("shift_jis", errors="replace")
    if len(raw) + len(encoded) > length:
        break
    raw += encoded
return bytes(raw) + b"\x00" * (length - len(raw))
```

한 글자씩 인코딩하면 느릴 것 같지만, 실제로는 이름 종류가 적다. VMD는 본 이름 14종 안팎이
수만 번 반복되므로 **인코딩 결과를 dict에 캐시**하면 비용이 사라진다.

## 한 줄

> 고정 길이 + 가변 폭 인코딩 = 글자 단위 루프. 슬라이스는 답이 아니다.

관련: [실사 영상에서 MMD 모션 뽑기]({{< relref "/posts/autommd-video-to-vmd" >}})
