---
title: "EBML"
date: 2026-09-08T10:00:00+09:00
draft: false
tags: ["미디어", "포맷"]
summary: "Matroska·WebM의 바탕이 되는 이진 마크업. 요소 = ID + 크기 + 값이 중첩된 트리."
altnames: ["Extensible Binary Meta Language", "VINT"]
---

XML의 계층 구조를 이진으로 옮긴 범용 컨테이너 문법. 2002년 Matroska를 위해 만들어졌고, 2020년 RFC 8794로 표준화됐다. [[webm|WebM]] 도 이 위에 얹힌 하나의 DocType이다.

## 무엇인가

XML이 `<tag>값</tag>` 을 텍스트로 중첩하듯, EBML은 **ID · 크기 · 값** 세 덩어리를 이진으로 중첩한다. 태그 이름 대신 숫자 ID를 쓰고, 닫는 태그 대신 길이를 앞에 둔다. 파서는 ID를 모르는 요소를 만나면 크기만큼 건너뛰면 되므로 **앞뒤 호환이 쉽다.**

어떤 ID가 무슨 뜻인지는 EBML 자체가 아니라 **DocType**(matroska, webm 등)이 정한다. EBML은 문법이고, Matroska는 그 문법으로 쓴 스키마다.

## 구조

### 요소(element)

| 부분 | 인코딩 | 비고 |
| --- | --- | --- |
| ID | **VINT**, 마커 비트 포함 | 어떤 요소인지. Matroska는 1~4바이트 |
| 크기 | VINT, 마커 비트 제외 | 뒤따르는 값의 바이트 수. 최대 8바이트 |
| 값 | 크기만큼 | 아래 타입 중 하나 |

값 타입은 일곱 가지다 — **Master**(자식 요소들의 나열), Unsigned/Signed Integer, Float, String(ASCII), UTF-8, Date, Binary. 트리를 만드는 건 Master 하나다.

### VINT (variable-length integer)

첫 바이트의 **선행 0비트 개수 + 1** 이 전체 바이트 수다. 첫 1비트가 마커다.

```text
1xxxxxxx                    1바이트, 데이터 7비트
01xxxxxx xxxxxxxx           2바이트, 데이터 14비트
001xxxxx xxxxxxxx xxxxxxxx  3바이트, 데이터 21비트
...                         최대 8바이트, 데이터 56비트
```

```js
// 첫 바이트로 길이 구하기 (4바이트까지)
const len = first >= 0x80 ? 1 : first >= 0x40 ? 2 : first >= 0x20 ? 3 : first >= 0x10 ? 4 : 0;
// 크기 읽기: 마커 비트를 떼고 big-endian으로 이어 붙인다
let size = first & (0xff >> len);
for (let i = 1; i < len; i++) size = size * 256 + buf[offset + i];
```

**ID는 마커를 떼지 않는다.** `0x1A45DFA3` 처럼 마커가 포함된 4바이트를 그대로 비교한다. 크기는 마커를 뗀 값을 쓴다. 같은 VINT인데 해석이 다른 것이 헷갈리는 지점이다.

### 자주 만나는 ID

| ID | 요소 | 레벨 | 비고 |
| --- | --- | --- | --- |
| `0x1A45DFA3` | EBML 헤더 | 0 | 파일의 첫 요소. DocType, 버전 |
| `0x18538067` | Segment | 0 | 나머지 전부를 감싼다 |
| `0x114D9B74` | SeekHead | 1 | 다른 레벨1 요소 위치 색인 |
| `0x1549A966` | Info | 1 | TimecodeScale, Duration |
| `0x1654AE6B` | Tracks | 1 | 코덱·해상도·채널 |
| `0x1F43B675` | Cluster | 1 | 실제 프레임 묶음 |
| `0x1C53BB6B` | Cues | 1 | 탐색 인덱스. 라이브 스트림엔 없다 |
| `0xEC` | Void | 임의 | 자리 채움. 건너뛴다 |
| `0xBF` | CRC-32 | 임의 | 부모의 첫 자식으로 온다 |

## 알아둘 것

- **크기 미정(unknown size).** 크기 VINT의 데이터 비트가 전부 1이면(`0xFF`, `0x01FFFFFFFFFFFFFF` 등) 길이를 모른다는 뜻이다. Master 요소만 가능하다. 라이브 인코더가 Segment·Cluster에 쓴다 — 끝을 아직 모르니까. 파서는 자식을 읽어가다 **같은 레벨 이상의 ID** 가 나오면 요소가 끝났다고 판단해야 한다.
- **모든 비트가 1인 ID는 예약** 이다. `0xFF`, `0x7FFF` 같은 ID는 나올 수 없다.
- **헤더 없이는 뒤쪽만으로 해석할 수 없다.** Cluster 안의 블록은 Tracks가 정한 코덱과 TimecodeScale을 전제한다. [[mediarecorder]] 출력을 중간에서 잘라 쓸 때 걸리는 지점이다.
- **Cluster 경계 찾기는 파서 전체가 없어도 된다.** VINT 읽기 + ID 몇 개 + "Master면 안으로, 아니면 건너뛰기" 만 구현하면 충분하다.
- 확인 도구 — `mkvinfo -v file.webm`(MKVToolNix)은 요소 트리를 그대로 덤프한다. `ffprobe -show_packets` 는 블록 단위로 keyframe 여부(`flags=K_`)를 보여준다.
