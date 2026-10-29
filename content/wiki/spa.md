---
title: "SPA"
date: 2026-10-23T15:53:11+09:00
draft: false
tags: ["web", "javascript"]
summary: "HTML 한 장을 받은 뒤 화면 전환과 내용 채우기를 브라우저의 자바스크립트가 API를 불러 처리하는 웹 앱 구조."
altnames: ["Single Page Application", "싱글 페이지 애플리케이션"]
---

처음에 HTML 한 장과 스크립트를 받고, 그다음부터는 브라우저의 자바스크립트가 API를 불러 화면을 그리고 바꾸는 웹 앱 구조.

## 무엇인가

- 서버가 주는 HTML은 대개 `<div id="root">` 정도만 있는 틀이다. 글, 상품, 버튼 같은 내용은 스크립트가 JSON API를 불러 DOM에 넣는다.
- 주소가 바뀌어도 페이지를 새로 받지 않는다. History API로 URL만 바꾸고 필요한 데이터만 다시 부른다.
- React, Vue, Svelte 같은 프레임워크로 만든 사이트가 보통 이렇다. 첫 화면을 서버에서 미리 그려 보내는 SSR을 섞기도 한다.

## 알아둘 것

- `curl` 이나 `requests` 로 받은 HTML에는 원하는 값이 없는 경우가 많다. 브라우저 개발자 도구의 네트워크 탭에서 XHR/fetch 요청을 보는 편이 빠르다.
- 렌더링을 기다려야 하므로 자동화할 때는 `networkidle` 이나 특정 요소가 나타나기를 기다린다. 값만 필요하면 그 API를 직접 부르는 쪽이 더 안정적이다.
- API가 쿠키 인증을 쓰면, 같은 사이트 페이지 안에서 `fetch(url, {credentials: "include"})` 로 부르면 쿠키와 [[cors|CORS]] 조건이 화면과 같아진다.
