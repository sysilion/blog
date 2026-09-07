---
title: "CHZZK 채팅 비공식 프로토콜 뜯어보기 — chzzk-chat"
date: 2026-08-27T15:40:00+09:00
draft: false
tags: ["chzzk", "websocket", "go", "리버스엔지니어링", "연구"]
summary: "cmd 번호 하나로 굴러가는 WebSocket 프로토콜, 문자 합을 9로 나눈 서버 번호, 이중 인코딩된 JSON. 그리고 공식 API가 생긴 뒤에도 비공식이 남는 이유."
---

[chzzk-chat](https://github.com/sysilion/chzzk-chat)은 네이버 [[chzzk]] 실시간 채팅을 읽고 쓰는
Go 애플리케이션이다. CLI, GUI 오버레이, 봇이 한 저장소에 있다. 재미있는 건 기능이 아니라
**프로토콜 쪽**이라 그 얘기만 적는다.

## 연결까지 세 번 왕복한다

채널 ID 하나로는 붙을 수 없다. REST를 세 단계 거쳐야 WebSocket 주소와 토큰이 나온다.

```text
채널ID → (라이브 상세)   → chatChannelId
      → (토큰 발급)      → accessToken
      → WebSocket connect
```

두 도메인이 갈린다. 채널·라이브 정보는 `api.chzzk.naver.com`, 채팅 토큰은
`comm-api.game.naver.com`이다. 후자는 CHZZK 전용이 아니라 네이버 게임 공통 채팅 인프라라서
그렇다 — CHZZK가 기존 게임 채팅 시스템 위에 얹혀 있다는 흔적이다.

비로그인으로도 토큰이 나온다. 읽기 전용이면 쿠키가 필요 없다.

## 서버 번호는 문자 합을 9로 나눈 나머지다

가장 인상적이었던 부분. 접속할 채팅 서버는 응답에 들어 있지 않다. **클라이언트가 직접
계산한다.**

```go
// kimcore/chzzk 소스 기반: 각 문자 rune 합계 % 9 + 1
func ChatServerURL(chatChannelID string) string {
	sum := 0
	for _, c := range chatChannelID {
		sum += int(c)
	}
	n := sum%9 + 1
	return fmt.Sprintf("wss://kr-ss%d.chat.naver.com/chat", n)
}
```

`"abc"` = 97+98+99 = 294 → 294 % 9 = 6 → `wss://kr-ss7.chat.naver.com/chat`.

서버 사이드 로드밸런서 대신 **클라이언트 사이드 샤딩**이다. 같은 채널의 모든 시청자가 같은
서버로 모이므로 채팅 브로드캐스트가 서버 하나 안에서 끝난다. 채널 간 분산은 해시가 알아서
한다. 단순하고 상태가 없다.

대신 서버가 9대라는 사실이 프로토콜에 박제됐다. 늘리려면 클라이언트를 다 고쳐야 한다.
공식 앱은 함께 배포되니 상관없지만, 서드파티 입장에서는 **어느 날 조용히 깨질 수 있는
상수**다. 그래서 테스트에 범위 검증과 알려진 값 검증을 같이 넣었다.

## cmd 번호가 프로토콜의 전부다

프레임은 JSON 하나에 `cmd` 정수가 붙는 형태다. 번호 체계에 규칙이 보인다.

| cmd | 방향 | 의미 |
|---:|---|---|
| 0 | → | Ping (하트비트) |
| 10000 | ← | Pong |
| 100 | → | 연결 인증 요청 |
| 10100 | ← | 연결 승인 (SID 발급) |
| 5101 | → | 최근 채팅 요청 |
| 15101 | ← | 최근 채팅 응답 |
| 93101 | ← | 실시간 채팅 |
| 93102 | ← | 도네이션/구독 |
| 94008 | ← | 차단된 메시지 |
| 3101 | → | 채팅 전송 |

패턴이 있다. **요청 `N` → 응답 `10000 + N`.** 0/10000, 100/10100, 5101/15101이 그렇다.
서버가 먼저 보내는 이벤트는 9만 번대다. 그리고 채팅은 전송이 3101, 수신이 93101 —
`90000 + 3101`이다.

번호만 봐도 어떤 게 요청/응답 쌍이고 어떤 게 서버 푸시인지 구분된다. 문서 없이 캡처만 보고
구조를 잡을 수 있었던 이유다.

도네이션과 구독은 같은 `93102`로 온다. 안쪽 `msgTypeCode`로 갈린다(1=채팅, 10=후원,
11=구독).

## JSON 안에 JSON 문자열이 들어 있다

채팅 프레임의 `profile`과 `extras`는 객체가 아니라 **JSON이 담긴 문자열**이다.

```go
type rawChatMessage struct {
	Msg     string `json:"msg"`
	Profile string `json:"profile"` // JSON 문자열
	Extras  string `json:"extras"`  // JSON 문자열
}
```

보낼 때도 마찬가지로 이중 직렬화해야 한다.

```go
bdy, _ := json.Marshal(sendChatBody{
	Extras: string(extras), // extras 는 JSON 문자열로 이중 직렬화
	Msg:    message,
	...
})
```

왜 이럴까. 채팅 서버가 이 필드들의 내용을 해석하지 않고 **불투명한 페이로드로 통과시키기
때문**일 가능성이 크다. 서버는 문자열로만 다루니 안쪽 스키마가 바뀌어도 채팅 서버는 배포가
필요 없다. 게임 공통 인프라를 여러 서비스가 공유한다는 앞의 추측과도 맞아떨어진다.

대가는 클라이언트가 치른다. 파싱이 두 번이고, 이스케이프가 중첩돼 로그가 읽기 어려워진다.
그리고 이모티콘 정보(`emojis` 맵)가 저 안에 있어서, **이모티콘을 렌더링하려면 반드시 이중
파싱을 해야 한다.**

## 읽기와 쓰기는 인증 난이도가 다르다

- **READ**: 비로그인 토큰이면 된다. 아무나 붙어서 읽을 수 있다.
- **SEND**: `NID_AUT` + `NID_SES` 쿠키가 필요하다. 쿠키로 `getUserStatus`를 불러
  `userIDHash`를 얻고, 그걸 CONNECT 프레임에 `uid`로 넣는다.

읽기가 이렇게 열려 있는 건 오버레이·채팅 수집기 같은 도구가 많은 이유이기도 하다.

쿠키를 쓰는 쪽은 요청 헤더도 맞춰야 한다. `User-Agent`는 물론이고, 알림 테스트 API는
`Origin`과 `Referer`를 `studio.chzzk.naver.com`으로 정확히 넣어야 통과한다. **브라우저에서
온 것처럼 보이지 않으면 거절된다.**

## 하트비트와 재연결

- 하트비트 15초 (`cmd:0` → `cmd:10000`)
- 재연결 지수 백오프 3초 → 최대 30초
- 60초 이상 유지되면 백오프 리셋

Go에서 조심할 곳은 한 군데다. gorilla/websocket은 **커넥션당 동시 write가 1개**로 제한된다.
하트비트 고루틴과 채팅 전송이 겹치면 그대로 깨진다. 뮤텍스를 쥔 채 `WriteMessage`를 호출해서
막는다.

```go
// gorilla/websocket: 커넥션당 동시 write 1개 제한.
// mu 를 보유한 채로 WriteMessage 를 호출해 heartbeat 와의 concurrent write 를 방지합니다.
c.mu.Lock()
defer c.mu.Unlock()
```

타이밍 값을 인스턴스 필드로 뺀 것도 의도가 있다. 전역 상수면 테스트가 실제로 15초를
기다려야 한다. `WithTiming()`으로 주입 가능하게 해서 테스트는 밀리초 단위로 돈다.

## 공식 API가 생겼는데도 비공식이 남는 이유

CHZZK에는 이제 공식 OAuth API(`openapi.chzzk.naver.com`)가 있고, 이 저장소도 지원한다.
그런데 비공식 경로를 지우지 않았다. 이유가 코드에 드러난다.

**공식은 Socket.IO다.** raw WebSocket이 아니라 Session API를 통해 URL을 받아 Socket.IO로
붙는다. 프레임 하나 붙이면 되던 것이 라이브러리 의존이 된다.

**구독 이벤트에 상한이 있다.** 세션당 최대 30개다.

**할 수 없는 게 있다.** 방송 설정 변경은 공식이 `PATCH /open/v1/lives/setting`, 비공식이
`PUT /manage/v1/channels/{id}/live-setting`인데 커버 범위가 다르다. 도네이션 테스트 알림
발생(`donation-test`, `video-donation-test`, `mission-donation-test`, `party-donation-test`)
같은 건 아예 공식에 없다. 오버레이를 만들 때 실제 후원을 기다릴 수는 없으니 이게 필요하다.

그래서 둘 다 유지하고 설정으로 고른다. **공식 API는 안정성을, 비공식은 커버리지를 준다.**

## 같은 서비스, 다른 접근 — chicle과의 대비

같은 CHZZK를 붙인 다른 프로젝트([chicle](https://github.com/sysilion/chicle))는 VOD 채팅을
분석해 하이라이트를 뽑는다. 실시간이 아니라 **다시보기**를 다루므로 프로토콜이 완전히 다르다.

| | chzzk-chat | chicle |
|---|---|---|
| 대상 | Live | VOD |
| 프로토콜 | WebSocket (비공식) | REST (비공식) |
| 인증 | 토큰 / NID 쿠키 | 없음 |
| 방향 | 양방향 | 읽기 전용 |

VOD 쪽에도 재미있는 비공식 API 특성이 있다.

- `count` 파라미터를 **무시하고 항상 200건**을 준다
- `playerMessageTime` 커서로 오름차순 순회, `nextPlayerMessageTime`이 null이면 끝
- **커서 경계의 채팅이 다음 페이지에 중복 포함**된다 → 중복 제거가 필수다
- 음수 시간이 나온다 (대기실 채팅)

[[undocumented-api|비공식 API]]를 쓸 때 필요한 태도가 여기 다 있다. **문서가 없으니 파라미터를 믿지 말고 응답을
믿는다.** `count=500`을 보내고 500건이 왔다고 가정하는 코드는 조용히 데이터를 잃는다.

## 정리

비공식 프로토콜을 다루면서 남은 원칙.

1. **매직 넘버는 계산식이 있으면 주석으로 남긴다.** `% 9 + 1`은 왜 9인지 알 수 없지만,
   어디서 왔는지는 적을 수 있다.
2. **응답을 믿고 파라미터를 믿지 않는다.** `count`가 무시되는 API가 실재한다.
3. **깨질 상수는 테스트로 감싼다.** 서버 번호 범위, 알려진 입력의 알려진 출력.
4. **공식이 생겨도 비공식이 바로 죽지는 않는다.** 커버리지 차이를 확인하기 전에는.
