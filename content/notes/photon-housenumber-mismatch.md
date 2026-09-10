---
title: "Photon 이 당산로 111 을 'B111' 에 매칭해서 핀이 1km 밀렸다"
date: 2026-09-08T12:15:00+09:00
draft: false
tags: ["geocoding", "osm", "python"]
summary: "OSM 의 addr:housenumber 는 자유 문자열이다. 'B111,112호' 가 번지 111 로 걸린다."
---

## 무슨 일이

redtable_point 지도에서 한 가게의 핀이 엉뚱한 데 찍혀 있었다.

```
참나라숯불바베큐치킨통닭[포장전문]
서울특별시 영등포구 당산로 111
→ 37.5331226, 126.9021862   (당산동5가)
```

실제 당산로 111 은 당산동3가다. **1084 m 떨어져 있다.**

## 원인

[[photon]] 에 그대로 물어보면 1순위 결과가 이렇다.

```bash
curl -s "https://photon.komoot.io/api/?q=서울특별시 영등포구 당산로 111, South Korea&limit=1"
```

```json
{
  "osm_key": "shop", "osm_value": "hairdresser",
  "housenumber": "B111",
  "name": "세레니끄 당산점",
  "street": "당산로", "district": "당산2동"
}
```

미용실이다. [[nominatim]] 으로 같은 노드를 보면 정체가 드러난다.

```
세레니끄 당산점, 222, B111,112호, 당산로, 당산동5가, ...
```

이 가게의 **실제 도로명번호는 222** 이고, `B111,112호` 는 건물 안 호실이다.
OSM 의 `addr:housenumber` 가 자유 문자열이라 호실 번호가 번지 자리에 들어가 있었고,
전문 검색으로 동작하는 Photon 은 질의의 `111` 을 여기에 매칭했다.

## 재현 — 얼마나 흔한가

캐시된 주소 60건을 다시 던져 요청 번지와 응답 `housenumber` 를 대조했다.

```python
m = re.search(r'(\d+(?:-\d+)?)\s*$', addr.strip())   # 요청 번지
got = feature['properties'].get('housenumber')        # 응답 번지
```

```
검사 60건 중 번지 불일치 8건
  당산로36길 5     → 응답 5-1    (스시153)
  당산로32길 1-6   → 응답 1-15   (H-Style헤어살롱)
  국회대로34길 20-1 → 응답 20     (역전할머니맥주)
  당산로 163       → 응답 지하121 (영등포구청)
  ...
```

13%. 대부분은 인접 번지라 오차가 수십 m 지만, `B111`·`지하121` 처럼
**호실 번호가 번지로 매칭된 건은 km 단위로 튄다.**

## 그래서

`_geocode_address()` 가 첫 결과를 무조건 채택하는 게 문제였다.
`exactly_one=False` 로 후보 10개를 받아 요청 번지와 대조하도록 고쳤다.

```python
_UNIT_PREFIX_RE = re.compile(r"^(?:[Bb]\d|지하|반지하)")
# "당산로36길" 의 36 을 번지로 오인하지 않도록 뒤가 공백·콤마·끝인 것만 잡는다
_HOUSE_NUM_RE = re.compile(r"(?:대로|로|길|가|동)\s*(\d+(?:-\d+)?)(?=[\s,]|$)")
```

채택 우선순위는 **exact**(번지 정확 일치) → **near**(본번 일치, `5` vs `5-1`)
→ **street**(번지 없는 `osm_key=highway` way, 도로 중심점) 이고,
호실 접두가 붙은 housenumber 는 어느 단계에서도 쓰지 않는다.
어디에도 걸리지 않으면 **핀을 뺀다.** 틀린 좌표를 찍는 것보다 낫다.

Photon 이 도로 way 의 이름을 `street` 가 아니라 `name` 에 담아 주는 것도 함정이었다.
`street` 만 보면 도로 폴백이 통째로 죽은 코드가 된다.

번지 뒤 꼬리를 잘라낸 질의도 폴백으로 추가했다. 전문 검색이라
`도림로133길 14 미나리밭 오리사냥 문래점` 처럼 상호가 섞이면 번지를 놓친다.

결과 (554행 → 385개 핀):

```
match: exact=199 near=22 street=72 unverified=4
좌표 교정 69건, 100m 초과 37건, 최대 4847 m
```

캐시는 검증 없이 담긴 좌표라 버려야 한다. `CACHE_VERSION` 을 넣어 통째로 무효화했다.

## 결말 — 지오코더를 바꿨다

번지 검증을 붙여도 Photon 은 한계가 뚜렷했다. **OSM 에 한국 번지 자체가 없는 경우**가
많아 37건이 좌표를 못 얻고, 72건은 도로 중심점으로 떨어졌다.

[[kakao-local-api]] 를 1순위로 두고 Photon 을 폴백으로 남겼다.

```python
def _init_geocoders():
    geocoders = []
    kakao = _init_kakao()          # KAKAO_REST_API_KEY 가 없으면 None
    if kakao is not None:
        geocoders.append(("kakao", kakao))
    geocoders.append(("photon", _init_photon()))
    return geocoders
```

| | 실패 | 도로 중심점 | 핀 |
| --- | --- | --- | --- |
| Photon (번지 검증 후) | 37 | 72 | 385 |
| 카카오 + Photon 폴백 | **0** | 4 | **398** |

카카오는 없는 주소에 `total_count: 0` 을 주고 억지 매칭을 하지 않는다.
`당산로36길 5` 처럼 카카오도 못 찾는 주소는 Photon 폴백이 인접 번지로 받아냈다.

원본 사이트가 좌표를 명시한 매장으로 교차검증한 결과 **0.0 m, 2.6 m, 10.6 m** 로 일치했다.
배포본 기준 149건의 좌표가 바뀌었고 그중 44건이 100 m 이상, 9건이 1 km 이상 어긋나 있었다.

## 한 줄

지오코더 응답의 첫 줄을 믿지 말고, 요청한 번지가 응답에 그대로 있는지 대조하라.
한국 주소라면 애초에 OSM 기반 지오코더를 쓰지 않는 편이 낫다.
