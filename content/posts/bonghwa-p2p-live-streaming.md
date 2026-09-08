---
title: "봉화 — 시청자가 릴레이가 되는 P2P 라이브 스트리밍"
date: 2026-08-27T15:50:00+09:00
draft: false
tags: ["bonghwa", "p2p", "webrtc", "스트리밍", "연구"]
summary: "WebRTC DataChannel로 영상 chunk를 전파하는 라이브 스트리밍 프로토타입. MediaRecorder를 자르는 문제, leecher 대응, 그리고 자기 신고를 믿지 않는 점수 체계."
---

[봉화](https://github.com/sysilion/bonghwa)는 시청자가 동시에 릴레이 노드가 되는 [[p2p|P2P]] 라이브
스트리밍 프로토타입이다. 산봉우리에서 산봉우리로 신호를 넘기는 봉화에서 이름을 땄다.

핵심 구조는 한 줄로 요약된다. **영상 데이터는 P2P로, 제어 정보만 서버로.**

```text
OBS ──RTMP──► ingest(ffmpeg) ──┐
                               │ chunk-meta (제어)
streamer ─── MediaRecorder ────┼──────────► tracker (WebSocket)
                               │             ├ signaling relay
                               │             ├ fallback 저장소 (최근 40개)
                               ▼             ├ 채팅 broadcast
viewer ◄══ WebRTC DataChannel ══ viewer      └ 기여도 수집 + upstream 추천
   ╰── HTTP fallback: GET /chunks/:stream/:seq
```

시청자가 늘어도 서버 대역폭이 그만큼 늘지 않는 것이 목표다. 아래는 그 과정에서 실제로
막혔던 지점들이다.

## 1. MediaRecorder를 chunk마다 재시작하면 영상이 사라진다

라이브를 chunk로 쪼개려면 일정 간격으로 잘라야 한다. 가장 순진한 방법은 [[mediarecorder]]를
1.5초마다 `stop()`하고 다시 `start()`하는 것이다. **이러면 영상이 없어진다.**

`stop()`이 인코더의 미인코딩 백로그를 그냥 버리기 때문이다. 2880×1368 화면 공유에서 재보니
chunk 13개 전부 마지막 프레임이 1.08초 이전에 끝났다 — **녹화 창 1.5초 중 28% 이상이
증발했고, 실효 프레임레이트가 2.6fps로 떨어졌다.**

해법은 recorder를 멈추지 않는 것이다. 하나만 계속 돌리고(`start(timeslice)`) 나오는
바이트 스트림을 직접 자른다. 문제는 두 번째 이후 blob에는 [[webm|WebM]] 헤더가 없어서 그대로는
독립 디코딩이 안 된다는 점이다.

그래서 **최소한의 [[ebml]] 파서**를 짰다.

- 첫 blob에서 init segment(헤더)를 떼어 보관하고, chunk마다 앞에 붙인다
- **keyframe으로 시작하는 cluster 경계에서만** 자른다
- 결과물이 진짜 디코딩되는지는 ffmpeg로 만든 실제 파일로 검증한다

완전한 EBML 구현이 아니라 이 용도에 필요한 만큼만 다룬다. 요소 ID 읽기는 이런 식이다 —
첫 바이트의 선행 0비트 개수가 길이를 정한다.

```js
const len = first >= 0x80 ? 1 : first >= 0x40 ? 2 : first >= 0x20 ? 3 : first >= 0x10 ? 4 : 0;
```

여기서 얻은 교훈. **브라우저 API가 "스트리밍"을 표방해도 경계를 마음대로 정해주진 않는다.**
경계가 필요하면 컨테이너 포맷을 직접 알아야 한다.

부수 효과로 chunk 길이가 정확히 1.5초가 아니게 된다. 인코더가 keyframe을 드물게 넣으면
그만큼 길어진다. 그래서 재생 로직은 시간이 아니라 **seq 기준**으로 돌고, 1.5초는 지연
표시용 명목값으로만 쓴다.

## 2. 받는 경로는 3단계로 폴백한다

viewer는 chunk를 이 순서로 구한다.

1. **P2P** — 1.2초 타임아웃, 최대 2회 시도
2. **HTTP fallback** — `GET /chunks/:stream/:seq`
3. **skip** — 라이브 엣지에서 8 chunk 이상 뒤처지면 건너뛴다

라이브는 VOD가 아니라서 **늦게 도착한 데이터는 가치가 없다.** 기다리느니 버리고 따라잡는
편이 낫다. 이 판단이 P2P 스트리밍과 파일 공유의 가장 큰 차이다. BitTorrent는 모든 조각을
결국 받아야 하지만, 여기서는 못 받은 조각을 포기하는 것이 정상 동작이다.

fallback 저장소는 최근 40개(약 60초)만 유지한다. 그 밖은 404다. 서버를 CDN이 아니라
**안전망**으로 쓴다는 뜻이다.

## 3. MSE는 sequence 모드로

각 chunk가 독립 WebM이라 타임스탬프가 제각각이다. MSE의 기본 모드로 이어붙이면 재생이
어긋난다. `sequence` 모드를 쓰면 append하는 순서대로 타임라인을 이어준다.

라이브를 오래 틀어두면 버퍼가 계속 쌓여 `QuotaExceededError`가 난다. 5초마다 재생 위치
-30초까지 잘라낸다. 예외가 나도 복구 경로를 따로 둔다 — 브라우저마다 한계가 다르므로
**예방과 복구를 둘 다 넣어야 했다.**

## 4. Leecher 문제: 안 주고 받기만 하는 시청자

P2P의 고전 문제다. relay를 끄고 받기만 하는 peer가 많아지면 swarm이 무너진다.

업로드 스케줄러는 **받은 만큼 준다**(tit-for-tat 완화판). 큐를 `recvBytes` 순으로 정렬해서
기여한 peer의 요청을 먼저 처리한다. 여기에 함정이 하나 있다.

> 순수 `recvBytes` 정렬만 쓰면 갓 접속한 peer는 영구 최하위가 된다 — 아직 받은 게 없으니
> 줄 것도 없고, 못 받으니 계속 0인 교착이다.

그래서 **4건마다 1건은 `recvBytes=0`인 peer에게 양보한다**(optimistic unchoke). BitTorrent가
unchoke slot을, GossipSub이 opportunistic grafting을 두는 이유와 같다. 선택은 무작위 대신
큐 도착 순(FIFO)으로 했다 — 목적이 굶주림 해소라 탐색성이 필요 없고, 결정론적이라 테스트할
수 있다.

대역폭 제한은 token bucket이다. 시청자가 업로드 상한을 직접 정하고 relay를 끌 수도 있다.
**끌 수 있어야 한다.** 모바일 데이터로 보는 사람에게 릴레이를 강제할 수는 없다.

## 5. 자기 신고를 믿지 않는 점수 체계

tracker는 10초마다 오는 기여도 리포트로 upstream 추천 순위를 매긴다. 여기서 제일 재미있는
설계 결정이 나왔다.

**`sentBytes`는 보낸 쪽의 자기 신고다.** 크게 적으면 최우선 upstream이 되어 점수 체계 전체가
무력화된다. 그래서 받은 쪽이 신고한 `links[].recv`를 **[[attestation|증언]]**으로 쓴다.

```js
const credibility = Math.min(1, attestedBytes / Math.max(p.report.sentBytes, 1));
const sentRate = p.rates.sent * credibility;
```

정직한 peer는 두 값이 일치하므로 `credibility = 1`이다. 부풀린 만큼 그대로 깎인다.

남는 구멍도 코드에 적어뒀다. **서로 증언해 주는 [[sybil-attack|공모(sybil)]]는 막지 못한다.** 그래서 두 번째
방어선이 있다 — 같은 IP에 몰린 peer에 **제곱 감점**을 준다.

```js
const surplus = Math.max(0, colocated - IP_COLOCATION_THRESHOLD);  // 임계 2
return IP_COLOCATION_WEIGHT * surplus * surplus;                    // 0.25 × surplus²
```

제곱이라 2~3대 공유(가정용 NAT)는 사실상 무료지만, 10 peer 농장은 만점(3)을 통째로
상쇄한다. GossipSub v1.1의 P6(IP colocation) 아이디어를 그대로 가져왔다.

세 번째 디테일. 점수는 **누적 바이트가 아니라 최근 rate(bytes/s, EWMA)** 로 계산한다.
누적으로 하면 초반에만 기여하고 조용히 relay를 끈 peer가 오래 상위에 남는다.

그리고 리포트를 아예 안 보내는 회피 경로도 막아뒀다.

```js
// 동거 감점은 리포트 유무와 무관하게 걸린다 — 리포트를 생략하면 기본값 0.5를
// 그대로 받는다는 점을 이용해 sybil이 회피하는 경로를 남기지 않는다.
```

전체적으로 **안전 실패(fail-safe)** 방향으로 설계했다. 증언이 사라지거나 링크가 끊기면 점수가
낮아지는 쪽으로 움직인다. 공격자가 이득을 보는 방향으로 실패하지 않는다.

## 6. 제어 채널에는 backpressure가 없다

DataChannel에는 `bufferedAmount`로 backpressure를 걸 수 있다(peer당 4MB 상한). 그런데
tracker로 가는 **WebSocket 제어 채널에는 그런 게 없다.** 업링크가 막히면 fallback 업로드가
무한히 쌓인다.

직접 상한을 뒀다 — 8MB를 넘으면 fallback 업로드를 건너뛴다. 대신 **P2P `have` 공지는 계속
보낸다.** 서버로의 백업은 포기하더라도 swarm 전파는 유지하는 쪽이다. 무엇을 먼저 버릴지
정해두는 것이 폭주를 막는다.

비트레이트도 고정값이 아니라 해상도에서 역산한다.

```js
const BITS_PER_PIXEL_FRAME = 0.09; // 2.5Mbps @ 1280×720×30 에서 역산한 값
```

화면 공유는 1080으로 상한을 건다. Retina 원본(2880×1368)은 인코더가 못 따라간다 — 위에서
본 28% 손실이 여기서 나왔다.

## 7. 프로토콜 세부

| 항목 | 값 |
|---|---|
| chunk 길이 | 1.5초 (keyframe 경계, 독립 WebM) |
| 코덱 | VP8/Opus |
| DataChannel 프레임 | `have` / `req` / `chunk`, 16KB 분할 |
| 무결성 | SHA-256 (16자리로 절단) |
| chunk 보관 | viewer 30개, 서버 fallback 40개 |
| 스케줄러 tick | 200ms |
| 기여도 리포트 | 10초 |
| 재연결 백오프 | 1초 → 10초 |

수신 측에는 할당 방어가 들어간다. 상대가 선언한 chunk 크기가 16MB를 넘으면 거부한다 —
악의적인 크기 선언으로 메모리를 터뜨리는 걸 막는다. 재조립 중 버려진 chunk는 15초 후
회수한다.

## 8. RTMP ingest — WebRTC 없는 참가자

OBS로 방송하려면 브라우저가 없다. [[ffmpeg]]가 RTMP를 받아 1.5초 [[webm|WebM]] 세그먼트로 트랜스코딩해서
tracker에 올린다.

이 프로세스는 **headless streamer**로 참가한다. `webrtc:false`로 join해서 upstream 추천에서
제외된다. 첫 viewer는 HTTP fallback으로 받고, 그 시점부터 viewer 간 P2P 전파가 시작된다.

여기서 겪은 버그 두 개가 기억에 남는다.

- **ffmpeg busy-loop** — 연결 실패 시 즉시 재시도해서 CPU를 태웠다. 3초 백오프를 넣었다.
- **고아 프로세스** — 부모가 죽어도 ffmpeg가 남았다. SIGKILL로 정리한다.

## 9. streamer 교체 시 화면이 멈추던 문제

새 스트리머가 스트림을 이어받으면 viewer 화면이 갱신되지 않았다. 원인은 fallback 저장소에
남은 **이전 방송의 chunk**였다. 코덱과 타임라인이 다른 데이터를 MSE에 append하다 멈춘다.

takeover 시 미디어 상태를 초기화하고 `stream-reset`을 broadcast한다. viewer는 MediaSource를
재생성하고 ChunkStore를 비운다. 비트레이트 EWMA도 초기화한다 — **새 방송은 비트레이트가
다른데 이어서 돌리면 이전 값이 섞인다.**

## 정리

P2P 라이브에서 반복해서 마주친 것들.

1. **라이브는 늦은 데이터를 버려야 한다.** 완결성보다 지연이 우선이다. 파일 공유 프로토콜의
   직관을 그대로 가져오면 안 된다.
2. **자기 신고는 검증 가능한 형태로 받는다.** 남의 증언과 교차 확인할 수 없는 지표는 곧
   조작된다.
3. **감점은 제곱으로.** 선형이면 정상 사용자와 공격자를 함께 때리고, 제곱이면 정상 범위는
   거의 무료다.
4. **버릴 것의 우선순위를 미리 정한다.** 8MB backpressure에서 fallback을 버리고 have를
   남긴 것처럼.
5. **브라우저 API의 추상화는 생각보다 얕다.** MediaRecorder를 chunk 경계로 쓰려면 결국
   EBML을 읽어야 했다.

다음 단계는 tracker를 Freenet Contract로 치환하는 Phase 4다. 지금은 signaling과 평판이
중앙에 있으니, 진짜 탈중앙이라 부르기엔 아직 이르다.
