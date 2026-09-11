---
title: "<script> 안에서 jsonify 를 쓰면 따옴표가 두 겹이 된다"
date: 2026-09-11T11:30:00+09:00
draft: false
tags: ["hugo", "go", "javascript"]
summary: "Go html/template 이 JS 문맥에서 이미 따옴표를 붙여준다. jsonify 는 그 위에 한 겹 더 씌운다."
---

## 무슨 일이

비밀글 복호화에 쓸 솔트를 템플릿에서 자바스크립트로 넘겼다. 맞는 비밀번호를 넣었는데
계속 **"비밀번호가 틀렸다"** 가 떴다.

```go-html-template
var CFG = {
  salt: {{ .salt | jsonify }},
};
```

## 원인

렌더된 결과를 보니 따옴표가 두 겹이었다.

```js
salt: "\"3CEYiqtk5vVzkcaJpnSatA\"",
```

[[html-template]] 은 삽입 지점이 자바스크립트라는 걸 알아채면 **문자열에 따옴표까지 직접
붙여준다.** `jsonify` 는 이미 `"3CEY..."` 라는 *따옴표 포함 문자열*을 만들어 넘기므로,
그 위에 한 겹이 더 씌워진다.

값 자체는 `"3CEY..."` (앞뒤에 진짜 따옴표 문자가 들어간 문자열)가 되고, 이걸 `atob` 에 넣으면
쓰레기 바이트가 나온다 → 솔트가 달라짐 → 키가 달라짐 → GCM 인증 실패 → "비밀번호가 틀렸다".
**암호 쪽이 아니라 문자열 한 겹이 문제였다.**

## 재현

```bash
mkdir -p layouts && cat > layouts/index.html <<'EOF'
<script>
  var a = {{ "hello" }};
  var b = {{ "hello" | jsonify }};
</script>
EOF
hugo --quiet && grep -A2 "<script>" public/index.html
# var a = "hello";
# var b = "\"hello\"";
```

## 그래서

**JS 문맥에서는 파이프를 걸지 않는다.** `{{ .salt }}` 만으로 안전한 JS 문자열이 된다.
객체·배열을 통째로 넘길 때도 마찬가지다 — `{{ .Params.items }}` 가 알아서 JS 리터럴이 된다.

`jsonify` 가 필요한 자리는 JSON 파일을 출력할 때(`layouts/index.json`)나
`<script type="application/json">` 처럼 **내용이 JS 가 아닌 데이터**일 때다.

## 한 줄

> **`<script>` 안의 `{{ . }}` 는 이미 따옴표까지 붙은 JS 리터럴이다. `jsonify` 를 얹지 마라.**
