---
title: "SQLite는 DateTime(timezone=True)여도 시간대를 변환 없이 버린다"
date: 2026-10-21T02:56:53+09:00
draft: false
tags: ["sqlite", "sqlalchemy", "chicle"]
summary: "KST 02:45를 넣으면 02:45만 남는다. server_default=now()는 UTC라 한 컬럼에 기준이 둘 섞이고, 화면에는 9시간 어긋나 보인다."
---

## 무슨 일이

chicle의 분석 기록에서 02:45(KST)에 끝난 분석이 "10월 20일 17:45"로 표시됐다.
DB에는 `2026-10-20 17:45:36` 이 시간대 없이 들어 있었다. API가 그 값을 그대로 내보냈고,
브라우저는 시간대 없는 ISO 문자열을 현지 시각으로 읽었다.

## 원인

SQLAlchemy의 SQLite 방언에는 시간대를 담을 자리가 없다. `DateTime(timezone=True)` 로 선언해도
저장할 때 `tzinfo` 를 **UTC로 바꾸지 않고 그냥 떼어 낸다**. 읽을 때는 [[naive-datetime]]이 돌아온다.
`server_default=func.now()` 는 SQLite의 `CURRENT_TIMESTAMP`, 즉 UTC다.
그래서 같은 컬럼에 "UTC 벽시계 시각"과 "넣은 쪽의 벽시계 시각"이 섞일 수 있다.

## 재현

```python
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, Column, Integer, DateTime, text
from sqlalchemy.orm import declarative_base, Session
from sqlalchemy.sql import func

B = declarative_base()
class T(B):
    __tablename__ = "t"
    id = Column(Integer, primary_key=True)
    at = Column(DateTime(timezone=True))
    made = Column(DateTime(timezone=True), server_default=func.now())

e = create_engine("sqlite://"); B.metadata.create_all(e)
with Session(e) as s:
    s.add(T(id=1, at=datetime(2026, 10, 21, 2, 45, tzinfo=timezone(timedelta(hours=9)))))
    s.commit()
    print(s.execute(text("select at, made from t")).all())
# [('2026-10-21 02:45:00.000000', '2026-10-20 17:54:19')]   ← 앞은 KST 그대로, 뒤는 UTC
```

## 그래서

- 저장은 UTC 하나로 통일한다 (`datetime.now(timezone.utc)`).
- 내보낼 때 시간대가 없으면 UTC로 붙인다. `value.replace(tzinfo=timezone.utc).isoformat()` → `...+00:00`.
  브라우저의 `new Date()` 가 그제야 현지 시각으로 맞게 바꾼다.

**한 줄:** SQLite의 `timezone=True` 는 선언일 뿐, 시간대는 앱이 지켜야 한다.
