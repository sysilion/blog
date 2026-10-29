---
title: "맥 카카오톡 광고 도메인을 막으면 카카오 기업 페이지 배너가 뜬다"
date: 2026-10-29T10:17:03+09:00
draft: false
tags: ["kakaotalk", "macos", "dns"]
summary: "광고 서버를 0.0.0.0 으로 막아도 배너 자리는 남는다. SDK 번들에 든 기본 배너가 그 자리를 채운다."
---

## 무슨 일이

맥 카카오톡 광고를 DNS로 막아 보려 했다. 바이너리에서 광고 도메인 두 개를 찾았고,
`dig` 로 확인하니 둘 다 Tailscale DNS(`100.100.100.100`)에서 이미 `0.0.0.0` 이었다.
그런데도 광고가 계속 보였다.

## 원인

두 가지가 겹쳐 있었다.

첫째, `dig` 와 앱은 같은 DNS를 쓰지 않았다. `dig` 는 지정한 서버에 직접 묻지만
앱은 시스템 리졸버([[mdnsresponder]])를 거친다. 시스템 리졸버에 물으니 한쪽은
실제 광고 서버 IP를 돌려줬다.

```
$ dig +short serv.ds.kakao.com @100.100.100.100
0.0.0.0
$ dscacheutil -q host -a name serv.ds.kakao.com | grep ip_address
ip_address: 121.53.223.43
```

`/etc/hosts` 에 넣으니 시스템 리졸버도 `0.0.0.0` 을 돌려줬다. 그 뒤로는 연결 목록에
광고 서버가 없었고 앱 캐시(`Cache.db`)에도 새 광고 이미지가 쌓이지 않았다.

둘째, 그래도 배너가 남았다. 클릭하면 `https://www.kakaocorp.com/page/` 로 간다.
이 배너는 광고 SDK [[adfit]] 번들에 들어 있는 기본 배너다. 광고를 받아오지 못하면
SDK가 자리를 접는 대신 이걸 띄운다.

## 재현

```bash
B=/Applications/KakaoTalk.app
# 광고 도메인 (둘 다 display-ad-*.kgslb.com 으로 CNAME)
strings -a $B/Contents/MacOS/KakaoTalk | grep -oE 'display\.ad\.daum\.net|serv\.ds\.kakao\.com' | sort -u
dig +short serv.ds.kakao.com @168.126.63.1

# 앱이 실제로 쓰는 경로로 확인
dscacheutil -q host -a name serv.ds.kakao.com

# 기본 배너
R=$B/Contents/Resources/ad-fit-mac_AdFitMac.bundle/Contents/Resources
grep -oE 'https?://[^"]+' $R/default_bizboard.html     # https://www.kakaocorp.com/page/
```

## 그래서

`/etc/hosts` 에 두 줄을 넣고 캐시를 비웠다. 광고 상품은 더 이상 안 나오고
기업 페이지 배너만 남는다. 배너 자리까지 없애려면 앱 번들을 고쳐야 해서 거기서 멈췄다.

```
0.0.0.0 display.ad.daum.net
0.0.0.0 serv.ds.kakao.com
```

## 한 줄

DNS 차단이 먹었는지는 `dig` 말고 `dscacheutil -q host -a name` 으로 확인한다.
차단 후에 남은 배너가 어디로 링크되는지 보면 SDK 기본값인지 바로 알 수 있다.
