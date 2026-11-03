---
title: "ffmpeg -protocol_whitelist 는 -i 앞에 둬야 동작한다"
date: 2026-11-03T17:26:05+09:00
draft: false
tags: ["ffmpeg", "보안", "hls"]
summary: "-i 뒤에 두면 오류 없이 무시된다. 원격 HLS 입력에는 crypto 도 넣어야 AES 키를 연다."
---

## 무슨 일이

chicle 백엔드는 사용자가 넘긴 주소를 [[ffmpeg]] 입력으로 연다. 주소 검증을 거치긴 하지만,
`file:` 이나 `concat:` 같은 프로토콜이 섞여 들어와도 서버 파일을 읽지 못하게 한 겹 더 막고 싶었다.
`-protocol_whitelist` 를 넣었는데 처음에는 아무것도 막히지 않았다. 출력 옵션 자리에 넣었기 때문이다.

## 원인

`-protocol_whitelist` 는 입력(디먹서) 옵션이다. ffmpeg 는 옵션을 그 다음에 오는 파일에 붙이므로
`-i` 뒤에 쓰면 출력 쪽에 붙는다. 출력 쪽에 그 옵션이 없어도 경고 한 줄 없이 지나간다.

## 재현

```bash
$ ffmpeg -f lavfi -i sine=d=1 -y s.wav      # 시험용 파일

# -i 앞: 막힌다
$ ffmpeg -protocol_whitelist http,https,tcp,tls,crypto -i s.wav -f null -
[file @ ...] Protocol 'file' not on whitelist 'http,https,tcp,tls,crypto'!
Error opening input: Invalid argument

# -i 뒤: 그냥 재생된다
$ ffmpeg -i s.wav -protocol_whitelist http,https,tcp,tls,crypto -f null -
size=N/A time=00:00:01.00 ...
```

ffmpeg 9.0.2 에서 확인했다.

## 그래서

입력 종류에 따라 목록을 바꿔 `-i` 바로 앞에 넣는다.

```python
def protocol_opts(source):
    allowed = "file" if source.kind == "file" else "http,https,tcp,tls,crypto"
    return ["-protocol_whitelist", allowed]
```

원격 [[hls]] 는 `http,https` 만으로 부족하다. 플레이리스트 안의 세그먼트 주소를 열 때 `tcp`, `tls` 가
필요하고, AES-128 로 잠긴 스트림은 키 파일을 `crypto` 프로토콜로 읽는다. 치지직 VOD 가 여기에 해당한다.

## 한 줄

> `-protocol_whitelist` 를 넣었으면 `file:` 입력 하나로 실제로 막히는지 돌려 본다. 조용히 무시되는 옵션이다.
