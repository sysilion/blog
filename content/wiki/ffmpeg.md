---
title: "ffmpeg"
date: 2026-09-07T15:40:00+09:00
draft: false
tags: ["미디어", "cli"]
summary: "미디어 디먹싱·인코딩·필터 도구. 입력을 여는 단계에서 막히는 일이 잦다."
altnames: ["FFmpeg"]
---

**ffmpeg** 는 미디어 컨테이너를 풀고(디먹싱) 코덱을 갈고(인코딩) 필터를 거는 CLI 도구다.
파이프라인은 항상 *입력 열기 → 디먹싱 → 디코딩 → 필터 → 인코딩 → 먹싱* 순서다.

## 알아둘 것

`Invalid data found when processing input` 은 데이터가 깨졌다는 뜻이 아닌 경우가 많다.
디먹서가 입력을 열기를 거부한 것이다. 대표적으로 [[hls]] 디먹서의 세그먼트 확장자 필터가 있다.

```bash
ffmpeg -allowed_extensions ALL -extension_picky 0 -i playlist.m3u8 ...
```

플레이리스트가 임의 로컬 경로를 참조하지 못하게 막는 보안 장치인데, 정상 CDN 스트림도 같이 걸린다.

기본 [[user-agent]] 가 CDN에서 거부되는 일도 흔하므로 `-user_agent` 를 함께 지정하는 편이 안전하다.

옵션은 자리에 따라 붙는 대상이 다르다. `-i` 앞에 쓰면 그 입력의 옵션, `-i` 뒤에 쓰면 출력 옵션이다.
입력 전용 옵션을 `-i` 뒤에 두면 오류 없이 버려진다. `-protocol_whitelist` 로 열 수 있는 프로토콜을
제한할 때 특히 그렇다. 원격 [[hls]] 에는 `http,https,tcp,tls` 에 더해 AES 키를 읽는 `crypto` 가 필요하다.

```bash
ffmpeg -protocol_whitelist http,https,tcp,tls,crypto -i https://.../playlist.m3u8 ...
```
