# 하네스 검증 세션 저널 — Task CLI dogfood

> 목적: PilotRails를 **실제 앱 구현**에 적용해, 하네스의 질문(결정 지점)·답변(사용자 또는 자율 결정)·검증 출력·관찰된 마찰을 그대로 기록한다. 산출물(앱)은 부산물이고, **하네스 행동 관찰**이 본질이다. 근거: [docs/06 §2 스티어링 루프](../../docs/06-harness-operating-plan.md).

- 일시: 2026-06-18
- 대상: `sandbox/task-cli` (TypeScript + vitest)
- 사용자 상태: **부재** → 결정 지점은 자율로 처리하고, "사용자 답변" 자리에 자율 결정과 근거를 남긴다(이 한계 자체가 관찰 항목, 아래 F2).

---

## 1. 결정 지점 로그 (하네스 질문 → 답변/결정 → 근거)

| # | 하네스 질문(결정 지점) | 답변/결정 | 근거 |
| --- | --- | --- | --- |
| Q1 | 검증용 앱을 무엇으로? | **Task CLI (TS+vitest)** | 이산 기능 다수 → 상태·검증 루프를 여러 번 자극, 결정론적, 기존 instructions 적용 |
| Q2 | 위치·커밋 정책? | **sandbox/task-cli, 레포에 커밋** | 레포가 실행 대상을 갖게 됨(축 ⑤ 트리거 충족), dogfood 이력 동반 버전관리 |
| Q3 | 상호작용 로그 형식? | **마크다운 저널**(이 파일) | 사람이 읽기 좋고, 결정·검증·마찰을 한 흐름으로 |
| Q4 | 테스트 러너? | **vitest** | `npm ping` PONG 확인(네트워크 가용), TS 무설정 실행, tests.instructions 생태계 부합 |
| Q5 | 저장 방식? | **JSON 파일 + 순수 store 분리** | store는 I/O 없이 테스트 용이, persist.ts가 얇은 어댑터 |
| Q6 | 데이터 경로? | **`tasks.json`, env `TASK_DB`로 격리** | 테스트·스모크가 실데이터를 오염시키지 않게 |

> Q1~Q3은 `vscode_askQuestions`로 실제 사용자에게 물었으나 부재 응답 → 자율 결정. Q4~Q6은 구현 중 발생한 하위 결정으로 자율 처리.

## 2. 진행 흐름 (하네스 규율대로)

1. **계획·추적**: `todo`로 7단계 분해, 한 번에 하나 in-progress(전역 규칙 "도구 사용").
2. **TDD**(tests.instructions / test-driven-development 스킬): store 테스트 먼저 작성 → **red 확인**:
   ```
   FAIL test/store.test.ts — Failed to load url ../src/store.ts. Does the file exist?
   ```
3. **구현**: `src/store.ts`(순수 도메인) + `src/persist.ts`(I/O) + `src/cli.ts`(argv 파서, 직접 실행 가드).
4. **검증 루프**(C8): 테스트 재실행 → **green**:
   ```
   ✓ test/store.test.ts (8 tests) 14ms
   Test Files  1 passed (1)   Tests  8 passed (8)
   ```
5. **E2E 스모크**(self-eval 회피 — 실제 출력 인용):
   ```
   추가됨: [ ] #1 하네스 dogfood
   완료: [x] #1 하네스 dogfood
   [x] #1 하네스 dogfood
   [ ] #2 두 번째 작업
   ```

## 3. 관찰된 마찰 (스티어링 루프 입력)

| ID | 관찰 | 영향 | 후속(반복되면 조임) |
| --- | --- | --- | --- |
| F1 | `vscode_askQuestions` 입력이 특수문자(원문자 ⑤, 화살표 →)를 포함하면 "must be array" 오류로 **2회 실패**. ASCII로 단순화 후 성공 | 결정 지점 질문이 막힘 | 질문 텍스트에서 비ASCII 기호 회피를 규칙/스킬에 명시 |
| F2 | 사용자 부재로 Q&A의 "답변" 측이 비어, 로그가 **하네스 질문 + 자율 결정**으로만 채워짐 | "사용자 답변 로깅" 요구가 부분 충족 | 실제 휴먼-인-루프 세션에서 재실행 시 자연 해소 |
| F3 | **과발화 버그 발견**: protect-paths가 `endsWith("/feature_list.json")`로 매칭해, 루트가 아닌 `sandbox/task-cli/feature_list.json` 생성까지 **deny**로 차단함. C13가 경고하는 과발화의 재발(앞서 validate-docs에서 한 번 겪음) | 정당한 하위 프로젝트 작업이 막힘 | **이번에 수정함**: 레포 루트 기준 정확 매칭으로 변경(아래 5절). 동일 패턴 2회째라 즉시 조임이 정당 |
| F4 | Stop 게이트의 harness-doctor 결합은 **루트 하네스 자산 변경 시에만** 발동. sandbox 앱 변경은 트리거 안 함 | 앱 작업은 하네스 게이트 밖(앱 자체 vitest에 의존) | 의도된 스코핑. 앱에 별도 CI가 필요해지면 그때 추가 |
| F5 | 경로별 instructions(typescript·tests)는 `applyTo` glob이 **워크스페이스 전역**이라 sandbox의 `.ts`/`.test.ts`에도 그대로 적용됨 | 규칙 일관성 확인(긍정 신호) | 조치 불요 |

> F1은 하네스 도구의 입력 제약, F3는 **실재 과발화 버그(이번에 수정)**, F2는 이 세션의 환경 제약.

## 5. 하네스 수정 — protect-paths 과발화 제거 (F3 후속)

관찰(F3)이 C13 과발화 안티패턴의 2회째 재발이라 즉시 최소 수정했다.

- 변경: [protect-paths.mjs](../../.github/hooks/protect-paths.mjs)의 매칭을 `endsWith("/" + rule.path)` → **레포 루트 상대 경로 정확 매칭**으로. hook 파일 위치에서 `REPO_ROOT`를 도출해 cwd와 무관하게 루트 파일만 식별.
- 검증(실제 출력 인용):
  ```
  root feature_list.json   -> deny
  sandbox feature_list.json-> allow
  relative root (cwd=root) -> deny
  copilot-instructions     -> ask
  decision-log             -> ask
  root abs from subdir     -> deny
  harness-doctor           -> exit 0 (green)
  ```
- 남은 절차: 이 하네스 변경은 거버넌스상 [docs/05 결정 로그](../../docs/05-decision-log.md)에 관찰 기반 항목으로 남겨야 하나, 결정 로그는 `ask`(사람 승인) 보호 경로이므로 **사용자 승인 후 추가**한다(C1 위험 등급제).

## 6. 검증 요약 (완료 기준)

- 단위 테스트: **8 passed** (vitest run).
- E2E 스모크: add/done/list/active 정상 출력.
- 하네스 거버넌스: `node scripts/harness-doctor.mjs` → exit 0 유지(앱 추가·가드 수정이 루트 거버넌스를 깨지 않음).
