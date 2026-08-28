---
title: "ffmpeg HLS 입력이 Invalid data로 죽으면 확장자 필터를 의심하라"
date: 2026-08-27T16:45:00+09:00
draft: false
tags: ["ffmpeg", "hls", "오디오"]
summary: "-allowed_extensions ALL -extension_picky 0. 세그먼트가 .m4s면 디먹서가 기본으로 막는다."
---

## 무슨 일이

VOD 음량 분석용으로 HLS(m3u8)에서 오디오만 뽑으려는데 계속 실패했다.

```text
Invalid data found when processing input
```

URL은 브라우저에서 잘 재생되고, 서명도 유효했다.

## 원인

ffmpeg의 HLS 디먹서는 **세그먼트 확장자 화이트리스트**를 가진다. `.m4v` / `.m4s` 같은
fMP4 세그먼트는 기본적으로 거부된다. 로컬 플레이리스트가 임의 경로를 참조하지 못하게 막는
보안 장치인데, 정상 CDN 스트림도 같이 걸린다.

## 그래서

두 플래그를 항상 붙인다.

```python
"-allowed_extensions", "ALL",
"-extension_picky", "0",
```

같이 필요했던 것: CDN이 ffmpeg 기본 User-Agent를 거부해서 `-user_agent`도 항상 넣는다.
반대로 **Referer는 불필요**하다 — 서명 URL의 hmac으로 인증되기 때문이다.

덤으로, 오디오만 필요할 때는 **최저 화질 트랙**을 고르면 다운로드가 훨씬 빨라진다. 어차피
영상은 버린다. 6시간 VOD가 4워커 병렬로 13분이었고, 병목은 디코딩이 아니라 다운로드였다.

## 한 줄

> `Invalid data found`는 대개 데이터가 깨진 게 아니라 **ffmpeg가 열기를 거부한 것**이다.
