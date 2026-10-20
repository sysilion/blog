---
title: "CHZZK에는 VOD 임베드가 없다 — /embed/video는 '존재하지 않는 채널'이 된다"
date: 2026-10-20T01:35:44+09:00
draft: false
tags: ["chzzk", "iframe", "chicle"]
summary: "임베드 주소가 200으로 오류 화면을 줘서 iframe onError도 안 뜬다. 원본 mp4·HLS를 직접 재생해 해결했다."
---

## 무슨 일이

chicle의 영상 패널이 `https://chzzk.naver.com/embed/video/{no}`를 iframe으로 띄우고 있었는데,
재생이 안 됐다. iframe 안에는 치지직 사이트 전체와 **"존재하지 않는 채널입니다"**가 떴다.
막혔을 때 보여주려던 대체 화면도 나오지 않았다.

## 원인

[[chzzk]] 웹 앱 라우터에는 `/embed/clip/:clipUID`만 있고 `/embed/video`는 없다.
그래서 `embed`가 `/:channelId`의 채널 ID로 해석된다. 응답은 정상 200이라 iframe의
`onError`가 발동하지 않는다. 일반 VOD 페이지는 [[frame-ancestors]]로 naver.com 밖을 막는다.

```bash
curl -sI https://chzzk.naver.com/video/15088168 | grep -i content-security
# content-security-policy: frame-ancestors 'self' https://naver.com https://*.naver.com
curl -sI https://chzzk.naver.com/embed/video/15088168 | grep -ic frame-ancestors   # 0 — 막지는 않지만 페이지가 없다
```

## 그래서

재생 원본을 `<video>`로 직접 받았다. 두 배포 방식 모두 [[cors]]가 열려 있다.

| VOD 종류 | 원본 | CORS |
|---|---|---|
| 트랜스코딩 완료 | neonplayer 재생 API → mp4 (moov가 앞, Range 지원) | API는 Origin을 그대로 허용, mp4는 `*` |
| 방송 직후 리와인드 | [[hls]] (fMP4) | `*` |

함정 두 가지가 더 있었다.

- Chrome도 이제 `canPlayType('application/vnd.apple.mpegurl')`에 `"maybe"`를 답한다. 그런데
  이 리와인드 스트림을 네이티브로 열면 `readyState 0`에서 멈춘다. hls.js를 먼저 쓰고 네이티브는 iOS용으로만 남겼다.
- 자동화 브라우저 탭은 `document.visibilityState === "hidden"`이라 Chrome이 미디어 로드를 미룬다.
  MediaSource가 열리지 않아 재생 실패처럼 보인다. 재생 검증은 headless Chrome으로 했다.

치지직 링크의 시점 파라미터도 `?t=`가 아니라 `?currentTime=`이다.

## 한 줄

> 200 응답의 오류 페이지는 iframe에서 실패로 보이지 않는다. 임베드는 응답 코드가 아니라 화면을 확인한다.
