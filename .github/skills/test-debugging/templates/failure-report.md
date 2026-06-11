# 실패 리포트 — <테스트/증상>

> [test-debugging](../SKILL.md) 절차의 출력 양식. 같은 실패 자가수정은 최대 2회, 초과 시 이 리포트를 동봉해 에스컬레이션(C8).

| 항목 | 내용 |
| --- | --- |
| failing command | <실제 실행한 명령 그대로> |
| baseline status | <변경 전 기존 실패 목록 / "기준선 green"> |
| new failure or existing failure | <신규 / 기존(pre-existing)> |
| first failing assertion | <가장 먼저 실패한 단언/메시지> |
| suspected files | <의심 파일 경로 목록> |
| attempted fixes | <시도한 수정과 결과 (1, 2 …)> |
| next action | <다음 행동 / 에스컬레이션 대상> |
| stop condition | <멈춤 조건: 자가수정 2회 초과 등> |
