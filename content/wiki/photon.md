---
title: "Photon"
date: 2026-09-08T12:10:00+09:00
draft: false
tags: ["geocoding", "osm"]
summary: "OpenStreetMap 데이터를 Elasticsearch 로 색인해 만든 오픈소스 지오코더. API 키가 없다."
altnames: ["photon.komoot.io", "Photon geocoder"]
---

OpenStreetMap 데이터를 Elasticsearch 에 색인해 만든 오픈소스 지오코더. Komoot 이 만들었고 `photon.komoot.io` 에서 공개 인스턴스를 운영한다.

## 무엇인가

- **API 키가 필요 없다.** Nominatim 과 달리 요청량 제한이 느슨해서 소규모 배치 지오코딩에 쓰기 좋다. geopy 의 `Photon` 클래스로 바로 붙는다.
- **전문 검색(full-text search) 방식이다.** 주소를 구조적으로 파싱하는 게 아니라 색인된 문서에 점수를 매겨 정렬한다. 그래서 "서울특별시 영등포구 당산로 111" 같은 질의는 토큰 매칭으로 처리되고, 첫 번째 결과가 반드시 그 번지인 것은 아니다.
- 응답은 GeoJSON `FeatureCollection`. `properties` 에 `housenumber`, `street`, `district`, `city`, `osm_key`/`osm_value` 가 들어온다.

## 알아둘 것

- **`housenumber` 는 OSM 원본을 그대로 물고 온다.** OSM 의 `addr:housenumber` 는 자유 문자열이라 `B111,112호`, `지하121` 같은 값이 실제로 존재하고, Photon 은 이걸 숫자 `111`·`121` 로 매칭한다. → [Photon 번지 오매칭 사례]({{< relref "/notes/photon-housenumber-mismatch" >}})
- 따라서 **응답의 `housenumber` 를 요청 번지와 대조하지 않으면 안 된다.** 첫 결과를 그대로 신뢰하면 같은 도로의 엉뚱한 건물에 핀이 꽂힌다.
- 한국 주소는 지번/도로명 두 체계가 섞여 색인돼 있다. 도로명으로 질의하면서 지번 데이터에 걸리는 경우도 나온다.
- 검증이 필요할 때는 [[nominatim]] 으로 교차 확인한다. 같은 OSM 데이터를 쓰지만 주소를 구조적으로 파싱하기 때문에 결과의 `display_name` 에 전체 주소 계층이 다 찍혀 나와 오매칭을 눈으로 잡기 쉽다.
