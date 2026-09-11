---
title: "Hugo 가 data 속성의 base64 에서 + 를 &#43; 로 바꾼다"
date: 2026-09-10T15:45:00+09:00
draft: false
tags: ["hugo", "go", "html"]
summary: "Go html/template 의 속성 이스케이프는 + 도 대상이다. base64url 로 피한다."
---

## 무슨 일이

암호문을 base64 로 만들어 `data-ct` 속성에 실었다. 브라우저에서는 잘 풀렸는데,
빌드 결과 HTML 을 스크립트로 긁어 검증하려니 `atob` 이 터졌다.

```
DOMException [InvalidCharacterError]: Invalid character
```

출력 HTML 을 열어보니 base64 안의 `+` 가 전부 `&#43;` 로 바뀌어 있었다.

```html
data-ct="...G4BntG/YZ&#43;fXoTuUOnv8eGdeS6Z0&#43;uhr0z7i0GfJed/tBj2t9vuQo3upEcHqohiXd&#43;9k..."
```

`/` 와 `=` 는 그대로인데 `+` 만 바뀐다.

## 원인

[[hugo]] 의 템플릿 엔진은 Go [[html-template]] 이고, 이건 **문맥 인식 자동 이스케이프**를 한다.
속성값 이스케이프 테이블에 `<`, `>`, `&`, `"`, `'` 뿐 아니라 **`+` 도 들어 있다.**
UTF-7 인코딩을 악용한 XSS를 막으려는 방어적 처리다. 끄는 방법은 없고, 꺼서도 안 된다.

브라우저는 속성을 읽을 때 HTML 엔티티를 되돌리므로 `element.dataset.ct` 로는 원래 `+` 가 나온다.
**동작에는 문제가 없다.** 문제는 렌더된 HTML 을 텍스트로 파싱하는 쪽이다.

## 재현

```bash
mkdir -p layouts && cat > layouts/index.html <<'EOF'
<div data-x="{{ "a+b/c=" }}"></div>
EOF
hugo --quiet && grep -o 'data-x="[^"]*"' public/index.html
# data-x="a&#43;b/c="
```

## 그래서

[[base64url]] 로 인코딩한다. 알파벳이 `A-Za-z0-9-_` 라 이스케이프 대상이 하나도 없다.

```js
// 굽는 쪽 (Node)
buf.toString('base64url')

// 푸는 쪽 (브라우저)
atob(s.replace(/-/g, '+').replace(/_/g, '/'))
```

`blog/layouts/secret/single.html` 이 이 방식이다.

## 한 줄

> **Go html/template 은 속성 안의 `+` 를 `&#43;` 로 바꾼다. 바이너리를 속성에 실을 땐 base64url.**
