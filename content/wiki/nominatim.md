---
title: "Nominatim"
date: 2026-09-08T12:12:00+09:00
draft: false
tags: ["geocoding", "osm"]
summary: "OpenStreetMap 공식 지오코더. 주소를 구조적으로 파싱해 계층 전체를 돌려준다."
altnames: ["nominatim.openstreetmap.org"]
---

OpenStreetMap 재단이 운영하는 공식 지오코더. `nominatim.openstreetmap.org` 에서 무료로 쓸 수 있다.

## 무엇인가

- **주소를 구조적으로 파싱한다.** 국가 → 시 → 구 → 동 → 도로 → 번지 계층을 실제로 해석해서 매칭하며, 결과의 `display_name` 에 그 계층 전체를 이어붙여 돌려준다.

```bash
curl -H "User-Agent: myapp/1.0" \
  "https://nominatim.openstreetmap.org/search?q=서울특별시 영등포구 당산로 111&format=json"
```

```
씨에프, 111-2, 당산로, 당산동3가, 당산1동, 영등포구, 서울특별시, 07260, 대한민국
```

- 그래서 **오매칭을 눈으로 잡기 쉽다.** 번지가 어디서 온 값인지 `display_name` 만 봐도 드러난다. → [Photon 번지 오매칭 사례]({{< relref "/notes/photon-housenumber-mismatch" >}})

## 알아둘 것

- **`User-Agent` 헤더가 필수다.** 없으면 403. 앱 이름을 식별 가능하게 넣어야 한다.
- **초당 1건 제한.** 공개 인스턴스의 이용 정책이며 어기면 차단된다. 대량 배치에는 못 쓴다 — 그럴 때 [[photon]] 을 쓰지만 대신 번지 검증을 직접 해야 한다.
- 결과를 영구 캐시하는 것은 허용되며, 오히려 권장된다.
