---
title: "AdFit"
date: 2026-10-29T10:17:03+09:00
draft: false
tags: ["kakao", "advertising"]
summary: "카카오의 광고 플랫폼. 카카오톡 PC·맥 클라이언트의 배너 광고를 SDK로 띄운다."
altnames: ["카카오 애드핏", "AdFitMac"]
---

AdFit(애드핏)은 카카오가 운영하는 광고 플랫폼이다. 앱과 웹에 SDK를 넣으면 광고 서버에서 배너를 받아와 보여준다.

## 구조

맥 카카오톡에는 Swift 패키지 `AdFitMac` 으로 들어 있다. 번들 안의 리소스는
`KakaoTalk.app/Contents/Resources/ad-fit-mac_AdFitMac.bundle/` 에 있다.

- 광고 요청은 `display.ad.daum.net` 과 `serv.ds.kakao.com` 로 간다. 두 도메인 모두 `display-ad-*.kgslb.com` 의 CNAME이다.
- 광고 소재 이미지는 `t1.daumcdn.net/b2/creative/...` 나 `t1.kakaocdn.net/b2/creative/...` 에서 받는다. 이 CDN은 광고가 아닌 이미지도 함께 서비스한다.
- 광고 단위 설정은 앱 환경설정 `com.kakao.KakaoTalkMac` 의 `AdFitMacStore` 키에 저장된다.

## 알아둘 것

광고를 받아오지 못하면 SDK는 배너 자리를 접지 않는다. 대신 번들에 든
`default_bizboard.html` 을 띄우며, 이 배너는 `https://www.kakaocorp.com/page/` 로 링크된다.
DNS로 광고 서버를 막은 뒤에 보이는 배너가 바로 이것이다.
