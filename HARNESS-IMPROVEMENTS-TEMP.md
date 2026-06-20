# PilotRails 임시 보완 메모

`checked_at`: 2026-06-19

이 문서는 프로젝트 완성 전까지 따로 관리할 보완 후보를 모아두는 임시 메모다. 완료 후 삭제해도 되는 파일로 둔다. 장기 보류 확장 후보는 [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md)에 남기고, 이 문서에는 현재 하네스를 더 단단하게 만들기 위한 운영 점검과 작은 보완만 기록한다.

## 삭제 조건

- 아래 항목을 처리하거나 의도적으로 하지 않기로 결정했다.
- 공개 문서에 필요한 내용은 [README.md](README.md), [docs/08-run-harness.md](docs/08-run-harness.md), [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md) 중 적절한 곳으로 옮겼다.
- 삭제 직전 `node scripts/harness-doctor.mjs`, `node --test tests/*.test.mjs`, `node scripts/smoke.mjs`를 실행해 통과를 확인했다.

## 현재 확인된 상태

| 항목 | 상태 | 확인 기준 |
| --- | --- | --- |
| 기능 레지스트리 | 완료 | [feature_list.json](feature_list.json)의 20개 항목이 모두 `done` |
| 거버넌스 정합 | 통과 | `node scripts/harness-doctor.mjs` |
| Node 회귀 테스트 | 통과 | `node --test tests/*.test.mjs`의 28개 테스트 통과 |
| hook CLI smoke | 통과 | `node scripts/hook-smoke.mjs`의 6개 hook payload 경로 통과 |
| sandbox smoke | 통과 | sandbox 의존성 설치 후 `node scripts/smoke.mjs` 실행 2, 건너뜀 0 |
| 작업트리 | 변경 있음 | 이 임시 메모와 보완 작업 파일 변경 중 |

## 처리 기록

| checked_at | 항목 | 처리 | 검증 |
| --- | --- | --- | --- |
| 2026-06-19 | `verify-done` git 상태 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs)에 `feature_list.json` 미커밋, 하네스 자산 변경, `stop_hook_active` 재진입 테스트 추가 | `node --test tests/*.test.mjs` 통과(14개) |
| 2026-06-19 | local smoke UX 개선 | [docs/08-run-harness.md](docs/08-run-harness.md)에 CI 수준 로컬 smoke 실행법과 `건너뜀` 의미 추가 | 문서 링크 검사 통과 |
| 2026-06-19 | VS Code Agent hooks 실제 발화 로그 | [docs/04-operational-validation.md](docs/04-operational-validation.md)에 UserPromptSubmit additional context 관찰 결과 기록 | 현재 채팅 컨텍스트에서 상태 요약 주입 관찰. 버전/payload 필드는 미기록 |
| 2026-06-19 | `/finish` 드라이런 기록 | [docs/04-operational-validation.md](docs/04-operational-validation.md)에 현재 보완 diff 기준 드라이런 보류 상태 기록 | `/finish`는 커밋 흐름 포함이라 사용자 승인 전 미실행 |
| 2026-06-19 | 복사 적용 체크리스트 | [docs/08-run-harness.md](docs/08-run-harness.md)에 다른 프로젝트 복사 후 확인 절차 추가 | 문서 링크 검사 통과 |
| 2026-06-19 | hook 주입·handoff 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs)에 `session-ready` 상태 요약, `precompact-handoff` 변경 파일 목록, git 비사용 경로 테스트 추가 | `node --test tests/*.test.mjs` 통과(18개) |
| 2026-06-19 | `precompact-handoff` 파일명 파싱 수정 | [precompact-handoff.mjs](.github/hooks/precompact-handoff.mjs)가 git porcelain 출력에서 파일명 첫 글자를 잘라먹을 수 있는 경로를 수정 | 실패 재현 후 `node --test tests/*.test.mjs` 통과 |
| 2026-06-19 | hooks 직접 실행 예시 보강 | [docs/08-run-harness.md](docs/08-run-harness.md)에 `session-ready`, `precompact-handoff`, `verify-done` 재진입 stdin 예시 추가 | 문서 링크 검사 통과 |
| 2026-06-19 | hook CLI payload 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs)에 `protect-paths`, `validate-docs`, `session-ready`, `precompact-handoff`의 stdin JSON -> stdout JSON 테스트 추가 | `node --test tests/*.test.mjs` 통과(22개) |
| 2026-06-19 | cloud agent 보류 조건 명시 | [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md)에 GitHub Copilot cloud agent target 보류 사유와 재검토 조건 추가 | 문서 링크 검사 통과 |
| 2026-06-19 | `verify-done` CLI block 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs)에 `feature_list.json` 미커밋 변경과 `harness-doctor` 실패 시 Stop hook block JSON 출력 테스트 추가 | `node --test tests/*.test.mjs` 통과(24개) |
| 2026-06-19 | `verify-done` stderr 캡처 정리 | [verify-done.mjs](.github/hooks/verify-done.mjs)가 내부 `harness-doctor` stderr를 터미널에 흘리지 않고 block reason에 담도록 조정 | `node --test tests/*.test.mjs` 통과(24개) |
| 2026-06-19 | `harness-doctor` fixture 테스트 보강 | [harness-doctor.test.mjs](tests/harness-doctor.test.mjs)에 임시 하네스 루트의 보호 경로 문서 누락 실패와 정합 성공 테스트 추가 | `node --test tests/harness-doctor.test.mjs` 통과(2개) |
| 2026-06-19 | `harness-doctor` 테스트 루트 주입 | [scripts/harness-doctor.mjs](scripts/harness-doctor.mjs)가 `PILOTRAILS_ROOT`로 테스트 fixture 루트를 읽을 수 있게 조정 | `node --test tests/harness-doctor.test.mjs` 통과(2개) |
| 2026-06-19 | `harness-doctor` fixture import 격리 | [scripts/harness-doctor.mjs](scripts/harness-doctor.mjs)가 `PILOTRAILS_ROOT`의 [protect-paths.mjs](.github/hooks/protect-paths.mjs)를 import하도록 조정 | 실패 재현 후 `node --test tests/harness-doctor.test.mjs` 통과(3개) |
| 2026-06-19 | custom 보호 경로 drift 테스트 | [harness-doctor.test.mjs](tests/harness-doctor.test.mjs)에 fixture 전용 보호 경로가 설계서에 빠지면 실패하는 테스트 추가 | `node --test tests/harness-doctor.test.mjs` 통과(3개) |
| 2026-06-20 | 남은 hook 이벤트 직접 실행 | [docs/04-operational-validation.md](docs/04-operational-validation.md) G-5에 SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, PreCompact CLI 검증 결과 기록 | 각 hook을 stdin JSON으로 직접 실행해 expected output 확인 |
| 2026-06-20 | hook CLI smoke 정규화 | [scripts/hook-smoke.mjs](scripts/hook-smoke.mjs)와 [hook-smoke.test.mjs](tests/hook-smoke.test.mjs)를 추가하고 [README.md](README.md), [docs/08-run-harness.md](docs/08-run-harness.md)에 연결 | 실패 재현 후 `node --test tests/hook-smoke.test.mjs`, `node scripts/hook-smoke.mjs` 통과 |
| 2026-06-20 | `/finish` 검증 드라이런 | [docs/04-operational-validation.md](docs/04-operational-validation.md) H 표에 현재 보완 diff 기준 검증 드라이런 결과 기록 | `git status --porcelain`, diff stat, `harness-doctor`, 전체 Node 테스트, `hook-smoke`, `smoke` 통과. 커밋은 미요청으로 보류 |
| 2026-06-20 | Copilot debug log 확인 | [docs/04-operational-validation.md](docs/04-operational-validation.md) G-5에 VS Code 1.124.2 / Copilot 0.52.0 확인과 payload 미노출 사실 기록 | debug log에서 버전 확인. hook payload 키워드는 검색 결과 없음 |

## 진행 현황 요약

| 상태 | 항목 | 현재 위치 |
| --- | --- | --- |
| 완료 | `verify-done` git 상태 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs) |
| 완료 | `session-ready` 상태 주입 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs) |
| 완료 | `precompact-handoff` 변경 파일 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs) |
| 완료 | `precompact-handoff` 파일명 파싱 버그 수정 | [precompact-handoff.mjs](.github/hooks/precompact-handoff.mjs) |
| 완료 | hook CLI payload 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs) |
| 완료 | `verify-done` CLI block 출력 테스트 보강 | [tests/hooks.test.mjs](tests/hooks.test.mjs) |
| 완료 | `verify-done` 내부 doctor stderr 캡처 정리 | [verify-done.mjs](.github/hooks/verify-done.mjs) |
| 완료 | `harness-doctor` 실패/성공 fixture 테스트 보강 | [harness-doctor.test.mjs](tests/harness-doctor.test.mjs) |
| 완료 | `harness-doctor` 테스트 루트 주입 | [scripts/harness-doctor.mjs](scripts/harness-doctor.mjs) |
| 완료 | `harness-doctor` fixture import 격리 | [scripts/harness-doctor.mjs](scripts/harness-doctor.mjs) |
| 완료 | custom 보호 경로 drift 테스트 | [harness-doctor.test.mjs](tests/harness-doctor.test.mjs) |
| 완료 | hook CLI smoke 정규 검증 루트 추가 | [scripts/hook-smoke.mjs](scripts/hook-smoke.mjs), [hook-smoke.test.mjs](tests/hook-smoke.test.mjs) |
| 완료 | local smoke skip 의미 문서화 | [docs/08-run-harness.md](docs/08-run-harness.md) |
| 완료 | hooks 직접 실행 예시 보강 | [docs/08-run-harness.md](docs/08-run-harness.md) |
| 완료 | 복사 적용 후 검증 체크리스트 보강 | [docs/08-run-harness.md](docs/08-run-harness.md) |
| 완료 | cloud agent 차이 재검토 조건 명시 | [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md) |
| 완료 | 문서 링크 검사 범위 유지 결정 | [validate-docs.mjs](.github/hooks/validate-docs.mjs) 변경 없음 |
| 완료 | 터미널 자동화 가능 항목 처리 | hook CLI, Stop block, doctor fixture, smoke UX, 적용 체크리스트 보강 완료 |
| 일부 관찰 | VS Code Agent hooks 실제 발화 로그 | [docs/04-operational-validation.md](docs/04-operational-validation.md)의 G-5 표에 UserPromptSubmit 채팅 관찰과 전체 hook CLI 검증 기록 완료 |
| 드라이런 완료 | `/finish` 드라이런 | [docs/04-operational-validation.md](docs/04-operational-validation.md)의 H 표에 검증 통과와 커밋 보류 기록 |
| 관찰 대기 | 실제 VS Code hook payload 샘플 | [docs/04-operational-validation.md](docs/04-operational-validation.md)의 G-5 표에 민감 정보 없이 기록 |
| 미진행 | 공개 릴리스 전 임시 파일 정리 | 이 파일 삭제 |

## 남은 보완 후보

터미널에서 재현 가능한 보완은 처리 완료 상태다. 남은 후보는 VS Code Copilot Chat과 Agent hooks Preview가 실제로 켜진 환경에서 관찰해야 하는 항목 3개와, 릴리스 직전 정리 항목 1개다.

| 우선순위 | 상태 | 항목 | 지금까지 한 일 | 다음 액션 | 완료 기준 |
| --- | --- | --- | --- | --- | --- |
| P1 | 일부 관찰 | VS Code Agent hooks 실제 발화 로그 | UserPromptSubmit의 상태 요약 additional context 관찰, 전체 hook 이벤트 CLI 직접 실행 결과를 [docs/04-operational-validation.md](docs/04-operational-validation.md) G-5에 기록 | SessionStart, PreToolUse, PostToolUse, Stop, PreCompact를 실제 VS Code 자동 발화로 트리거하고 UI 관찰 결과 기록 | G-5 표의 모든 hook 이벤트가 실제 VS Code 버전, 자동 발화 관찰 결과, 후속 조치를 가진다 |
| P1 | 드라이런 완료 | `/finish` 드라이런 시나리오 수행 | 현재 보완 diff 기준으로 H 표에 검증 드라이런 통과와 커밋 보류 상태 기록 | 사용자 명시 요청 후 실제 `/finish` 또는 커밋 단계를 수행 | [docs/04-operational-validation.md](docs/04-operational-validation.md) H 표에 실제 `/finish` 실행 여부와 커밋/보류 판단이 남는다 |
| P2 | 대부분 완료 | hook payload 호환성 샘플 축적 | stdin/stdout CLI payload 경로는 [tests/hooks.test.mjs](tests/hooks.test.mjs), [hook-smoke.test.mjs](tests/hook-smoke.test.mjs), [scripts/hook-smoke.mjs](scripts/hook-smoke.mjs), G-5 CLI 실행 기록으로 검증 완료. Copilot debug log에는 hook payload 원문이 남지 않음을 확인 | 실제 VS Code Diagnostics/UI에서 민감 정보를 제거하고 필드 이름, 이벤트명, 차단/경고 여부만 기록 | G-5 표 또는 별도 운영 메모에 실제 VS Code payload 필드 요약이 남는다 |
| P3 | 릴리스 정리 | 공개 릴리스 전 임시 파일 정리 | 이 파일에 완성 전 보완 상태를 임시로 관리 중 | 공개 문서에 필요한 내용만 정규 문서로 옮긴 뒤 이 파일 삭제 | 삭제 후 `git status -sb`, `node scripts/harness-doctor.mjs`, `node --test tests/*.test.mjs`, `node scripts/smoke.mjs` 통과 |

### 남은 후보 실행 순서

1. [docs/04-operational-validation.md](docs/04-operational-validation.md) G-5의 CLI 검증 행을 실제 VS Code 자동 발화 관찰로 보강한다.
2. 실제 VS Code payload 필드 요약을 민감 정보 없이 같은 표의 비고나 별도 운영 메모에 남긴다.
3. 사용자 명시 요청 후 실제 `/finish` 또는 커밋 단계를 수행하고 H 표를 갱신한다.
4. 릴리스 직전에 이 파일의 필요한 내용만 정규 문서로 옮기고 이 파일을 삭제한다.

## 하지 않을 가능성이 높은 것

| 항목 | 이유 |
| --- | --- |
| 새 런타임 구현 | PilotRails의 현재 목표는 VS Code Copilot 커스터마이징 계층이며 자체 에이전트 런타임이 아니다. |
| 상시 멀티에이전트 코딩 | 코드 작성 책임을 Build 단일 스레드에 두는 현재 설계와 충돌한다. |
| 광범위한 markdown lint 강제 | hook 알림 피로를 피하려는 설계 원칙과 충돌할 수 있다. 반복 실패가 관찰될 때만 추가한다. |

## 다음 점검 때 볼 순서

위 `남은 후보 실행 순서`를 따른다. 새 자동화 후보가 생기면 이 파일에 먼저 추가하고, 반복 마찰이 확인된 항목만 정규 문서나 테스트로 승격한다.