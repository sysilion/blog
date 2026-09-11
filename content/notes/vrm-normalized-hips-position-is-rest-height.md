---
title: "VRM 모델이 바닥 아래로 주저앉는다"
date: 2026-09-12T06:25:00+09:00
draft: false
tags: ["vrm", "three.js", "3d", "삽질"]
summary: "정규화 휴머노이드 리그의 hips.position.y 는 남은 찌꺼기가 아니라 골반이 바닥에서 떠 있는 높이다. 0을 넣으면 몸이 통째로 가라앉는다."
---

## 무슨 일이

모션 파일 없이 [[vrm|VRM]] 캐릭터를 움직이려고, 상태마다 휴머노이드 뼈를 직접 돌리는
코드를 썼다. 매 프레임 기본 자세로 되돌린 다음 상태별 회전을 얹는 방식이다.

```js
const hips = vrm.humanoid.getNormalizedBoneNode('hips');
if (hips) hips.position.y = 0;          // ← 지난 프레임 값을 지우는 셈 치고
// ...
case 'sit': if (hips) hips.position.y = -0.35; break;
```

머리와 어깨만 화면에 보였다. 다리는 어디에도 없었다.

## 원인

정규화 리그의 `hips` 노드에서 `position.y` 는 **골반이 바닥에서 얼마나 떠 있는가**다.
사람 모델이면 0.8~1.0m쯤 된다. VRM 규격이 모델을 바닥(y=0)에 세워 두라고 정하고 있어서,
골반은 당연히 그만큼 위에 있다.

거기 0을 넣으면 골반이 원점으로 내려오고 **몸 전체가 다리 길이만큼 바닥을 뚫는다.**
회전을 다루는 코드 사이에 섞여 있어서, 위치 초기화가 아니라 "남은 값 지우기"처럼 보인 것이
함정이었다.

## 재현

```js
const hips = vrm.humanoid.getNormalizedBoneNode('hips');
console.log(hips.position.y);   // 0.86 같은 값. 0이 아니다.
```

앉기·착지처럼 몸을 낮출 때는 **그 값을 기준으로 빼야** 한다.

```js
// 모델을 읽을 때 한 번 기억해 둔다
const hipsRestY = hips.position.y;

// 매 프레임
hips.position.y = hipsRestY;              // 기본 자세
hips.position.y = hipsRestY - 0.35;       // 앉기
```

## 곁다리 — 키를 바운딩 박스로 재지 마라

물리가 쓸 키를 `Box3().setFromObject(vrm.scene)` 로 쟀더니 클릭 판정이 머리 위 허공까지
잡혔다. 시험에 쓴 [VRM 공식 샘플 Seed-san](https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san)은
어깨에 커다란 기계팔을 얹고 있어서, 그게 통째로 키에 들어갔다.

머리 뼈는 그런 것에 흔들리지 않는다. 머리 뼈 높이가 전체 키의 0.87쯤이라고 보고 환산한다.

```js
vrm.scene.updateWorldMatrix(true, true);
const y = vrm.humanoid.getNormalizedBoneNode('head')
  .getWorldPosition(new THREE.Vector3()).y;
const meters = y / 0.87;
```

**재는 것은 배율을 먹이기 전에.** 순서를 바꿨더니 배율이 곱해진 값을 키로 읽어, 판정
영역이 화면 몇 백 개 높이가 되고 캐릭터가 화면 밖으로 사라졌다.

## 한 줄

`hips.position.y` 는 초기화 대상이 아니라 모델이 들고 온 값이다. 기억해 두고 거기서 빼라.
