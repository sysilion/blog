---
title: "faster-whisper 1.2.1은 PyAV 19에서 모든 파일 전사가 실패한다"
date: 2026-10-20T01:34:12+09:00
draft: false
tags: ["python", "stt", "의존성"]
summary: "PyAV 19가 av.open()의 metadata_errors 인자를 없앴는데 faster-whisper는 아직 넘긴다. 경로 대신 배열을 넘기면 피할 수 있다."
---

## 무슨 일이

chicle에서 하이라이트 구간 전사를 켜려고 [[faster-whisper]] 를 새로 설치했다. 구간 3개가
**전부** 실패했다. 그런데 분석 작업은 정상 완료로 끝났다. 구간별 실패를 경고 로그로만 남기고
넘어가는 구조라, UI에서는 "말소리가 없는 구간"처럼 보였다.

```
Clip 1 transcription failed: open() got an unexpected keyword argument 'metadata_errors'
```

## 원인

`pip install faster-whisper` 는 의존성을 `av>=11` 로만 걸어 둬서 최신 [[pyav]] 19가 깔린다.
faster-whisper 1.2.1의 `decode_audio()` 는 `av.open(path, metadata_errors="ignore")` 를 호출하는데,
PyAV 19에는 이 키워드 인자가 없다. 파일 경로를 넘기면 매번 이 디코딩 경로를 탄다.

## 재현

```bash
pip install faster-whisper==1.2.1 av==19.0.1
ffmpeg -v error -f lavfi -i sine=d=1 -ar 16000 -ac 1 s.wav
python -c "from faster_whisper.audio import decode_audio; decode_audio('s.wav')"
# TypeError: open() got an unexpected keyword argument 'metadata_errors'
```

## 그래서

`WhisperModel.transcribe()` 는 경로 말고 **16kHz float32 배열**도 받는다. 배열을 넘기면 PyAV를
아예 거치지 않는다. 입력은 이미 [[ffmpeg]] 로 16kHz mono s16le WAV로 잘라 뒀으니, 표준 라이브러리
`wave` 로 읽기만 하면 된다.

```python
with wave.open(path, "rb") as w:
    pcm = w.readframes(w.getnframes())
audio = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0
model.transcribe(audio, language="ko", vad_filter=True)
```

배열로 넘기면 faster-whisper는 리샘플링을 하지 않는다. 그래서 채널 수·샘플 폭·샘플레이트가
맞지 않으면 바로 예외를 던지게 했다. `av<19` 로 고정하는 방법도 있지만, 이미 디코딩이 끝난
데이터를 한 번 더 디코딩할 이유가 없다.

## 한 줄

> 하한만 걸린 의존성은 새로 설치할 때 깨진다. 실패를 삼키는 루프는 "전부 실패"를 "결과 없음"으로 바꿔 보여준다.
