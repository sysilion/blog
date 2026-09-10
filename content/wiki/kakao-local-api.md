---
title: "카카오 로컬 API"
date: 2026-09-10T14:20:00+09:00
draft: false
tags: ["geocoding", "kakao", "api"]
summary: "카카오가 제공하는 주소↔좌표 REST API. 한국 주소를 구조적으로 파싱한다."
altnames: ["Kakao Local API", "dapi.kakao.com", "카카오 지오코딩"]
---

카카오가 제공하는 장소·주소 검색 REST API. 한국 도로명주소와 지번주소를 구조적으로 파싱해 좌표로 바꾼다.

## 무엇인가

```bash
curl -G "https://dapi.kakao.com/v2/local/search/address.json" \
  --data-urlencode "query=서울특별시 영등포구 당산로 111" \
  -H "Authorization: KakaoAK ${KAKAO_REST_API_KEY}"
```

- **REST API 키를 쓴다.** 카카오맵 JavaScript SDK 와는 다른 제품이다. 앱 하나를 만들면 네이티브·JavaScript·REST·Admin 키가 함께 발급되며, 지오코딩을 서버나 CI 에서 하려면 REST 키여야 한다. JS 키로 호출하면 `AccessDeniedError` 가 돌아온다.
- 응답은 `documents` 배열. 각 문서에 `x`(경도), `y`(위도)가 **문자열로** 담기고, `address`(지번)와 `road_address`(도로명)가 따로 온다.
- 헤더 형식은 `Authorization: KakaoAK <키>` 다. 접두사를 빼면 `cannot find Authorization : KakaoAK header` 가 나온다.

## 알아둘 것

- **`address_type` 이 정확도를 알려준다.** 이 값을 보지 않으면 동 중심점을 번지 좌표로 오인한다.

| `address_type` | 의미 | 정확도 |
| --- | --- | --- |
| `ROAD_ADDR` | 도로명 + 건물번호 | 건물 단위 |
| `REGION_ADDR` | 지번주소 | 필지 단위 |
| `ROAD` | 도로만 특정 | 도로 중심 |
| `REGION` | 지역명(동)만 특정 | 동 중심 — 오차 큼 |

- `road_address.main_building_no` 로 요청 번지를 한 번 더 대조할 수 있다. 부번은 `sub_building_no` 에 따로 들어간다.
- **없는 주소는 `total_count: 0` 으로 조용히 빈 배열을 준다.** 억지 매칭을 하지 않는 게 [[photon]] 과 가장 다른 점이다.
- 실무 정확도는 OSM 기반 지오코더와 차이가 크다. → [[photon-housenumber-mismatch]]
