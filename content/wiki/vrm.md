---
title: "VRM"
date: 2026-09-12T06:25:00+09:00
draft: false
tags: ["3d", "아바타", "glTF"]
summary: "glTF 2.0 위에 휴머노이드 뼈·표정·시선·라이선스를 얹어 아바타를 한 파일로 주고받게 만든 규격."
altnames: ["VRM format", "VRMC_vrm"]
---

3D 아바타를 **한 파일로** 주고받기 위한 규격. [[gltf|glTF 2.0]] 바이너리(GLB)에
확장(`VRMC_vrm`)을 얹은 형태라, glTF 로더가 읽을 수 있으면 절반은 읽은 셈이다.

## 무엇인가

- **휴머노이드 뼈 이름이 규격이다.** `hips` `spine` `head` `leftUpperArm` … 55개 남짓.
  그래서 모델마다 뼈 이름을 맞추지 않아도 같은 코드로 자세를 만들 수 있다.
  모션 파일 없이 상태별로 뼈를 돌리는 방식이 성립하는 이유다.
- **표정(expression)** 과 **시선(lookAt)** 이 규격에 들어 있다.
- **스프링 본**(`VRMC_springBone`)으로 머리카락·옷자락 흔들림이 파일 안에 담긴다.
- **라이선스가 파일 안에 있다.** `meta` 에 재배포·개조·상업 이용 허용 여부와 크레딧 표기
  요구가 들어간다. 아바타를 다루는 도구는 이걸 읽어 보여 줘야 한다.
- 모델은 **+Z를 보고, Y가 위, 바닥 y=0, 미터 단위**로 서 있는 것이 규격이다.
  VRM 0.x는 -Z를 봐서 로더가 돌려 준다(`VRMUtils.rotateVRM0`).

## 알아둘 것

- 웹에서는 [three-vrm](https://github.com/pixiv/three-vrm) 이 사실상 표준 구현이다.
  `GLTFLoader` 에 플러그인으로 붙인다.
- **정규화 리그**(`getNormalizedBoneNode`)는 모델마다 다른 초기 회전을 지운 좌표계다.
  회전만 다루면 편하지만, `hips` 의 `position.y` 는 의미 있는 값이라 손대면 안 된다.
  → [[vrm-normalized-hips-position-is-rest-height]]
- +X가 **모델 기준 왼쪽**이다(+Z를 보고 서 있으므로). 좌우 팔의 회전 부호가 반대가 된다.
- 스킨드 메시라 장면 그래프를 복제하면 뼈가 얽힌다. 같은 모델을 여러 개 띄우려면
  파일을 다시 파싱하는 편이 확실하다.
