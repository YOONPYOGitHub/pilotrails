# Evals

이 문서는 [../scenarios.md](../scenarios.md)의 드라이런 시나리오를 실제로 돌렸을 때 남기는 **평가 결과 ledger**다. 목적은 PilotRails가 없는 흐름과 있는 흐름의 차이를 수치·로그·diff로 남겨, 하네스 효과를 LLM 자기평가가 아니라 저장소 안 증거로 판단하는 것이다.

현재 단계에서는 **실행형 평가 runner를 만들지 않는다**. 먼저 수동 ledger 형식을 안정화하고, 2~3회 이상 반복 결과가 쌓이면 `examples/evals/*.json` 또는 `*.yaml` 매니페스트와 runner를 검토한다. 보류 기준은 [docs/05-decision-log.md](../../docs/05-decision-log.md)의 보류 항목에 둔다.

## Ledger 작성 규칙

- `checked_at`, 실행자, VS Code/Copilot 버전 또는 CLI 환경을 적는다.
- `without harness`는 같은 시나리오를 하네스 개입 없이 수행한 기준선이다. 실행하지 않았으면 `미실행`으로 적고 추정하지 않는다.
- `with harness`는 Plan/Build/Ask/Explore, hooks, `/finish`, 검증 명령을 사용한 결과다.
- `evidence`에는 실제 명령 출력 요약, 차단·경고 로그, diff 통계, 커밋 해시를 적는다.
- 실패도 기록한다. 실패한 eval은 하네스 설계 개선의 입력이다.

## 공통 측정 필드

각 시나리오는 다음 필드를 갖춘 구조화된 케이스로 기록한다. [../scenarios.md](../scenarios.md)의 각 시나리오에 이미 같은 필드가 명시되어 있어, 나중에 그대로 매니페스트로 직렬화할 수 있다.

| 필드 | 의미 |
| --- | --- |
| `entry_agent` | 시작 에이전트(Plan/Build/Ask) |
| `allowed_agents` | 호출 가능한 서브에이전트 allowlist |
| `forbidden_actions` | 금지 동작(예: Plan의 edit/execute) |
| `expected_artifacts` | 기대 산출물(테스트·diff·문서 등) |
| `pass_condition` | 통과 조건 |
| `fail_condition` | 실패 조건 |
| `metrics` | 기록할 측정 지표([../scenarios.md](../scenarios.md) 측정 지표 표) |

## 결과 ledger

| ID | 시나리오 | checked_at | without harness | with harness | evidence | 판정 |
| --- | --- | --- | --- | --- | --- | --- |
| E-001 | 버그 수정 | 미실행 | 미실행 | 미실행 | [../scenarios.md](../scenarios.md) 1번 기준만 존재 | 대기 |
| E-002 | 작은 기능 추가 | 미실행 | 미실행 | 미실행 | [../scenarios.md](../scenarios.md) 2번 기준만 존재 | 대기 |
| E-003 | 대형 리팩터링 | 미실행 | 미실행 | 미실행 | [../scenarios.md](../scenarios.md) 3번 기준만 존재 | 대기 |
| E-004 | 테스트 실패 디버깅 | 미실행 | 미실행 | 미실행 | [../scenarios.md](../scenarios.md) 4번 기준만 존재 | 대기 |
| E-005 | 문서 편집 | 2026-06-27 | 미실행 | P0 문서·ready 보강에 Plan/Build식 검증 루프 적용 | `node scripts/ready.mjs --full` 통과, Node tests 29개, sandbox smoke 실행 2 건너뜀 0 | 부분 증거 |

## 결과 상세 템플릿

새 평가를 수행하면 아래 템플릿을 복사해 이 섹션 아래에 추가한다.

```markdown
### E-XXX. <시나리오명>

- checked_at:
- 환경:
- entry_agent:
- without harness:
- with harness:
- diff_size:
- self_fix_attempts:
- new_failures_introduced:
- test_pass:
- human_interventions:
- 차단·경고 로그:
- 최종 판정:
```

## 향후 매니페스트 형태 (예시 스케치, 미구현)

```yaml
# 미구현 — 형태 예시일 뿐 실행되지 않음
id: bugfix-login-blank
entry_agent: Plan
allowed_agents: [Explore]
forbidden_actions: [edit, execute]   # Plan 단계
expected_artifacts: [repro_test, fix_diff]
pass_condition: "재현 테스트가 통과하고 신규 실패 0"
fail_condition: "신규 실패 발생 또는 자가수정 2회 초과"
metrics: [test_pass, diff_size, self_fix_attempts, new_failures_introduced]
```

## 보류 (이번 단계 미수행)

- 실행형 평가 runner / 채점기
- 평가 runner 전용 GitHub Actions 연동(현재 CI 검증과 별개)
- 시나리오의 실제 YAML/JSON 매니페스트 파일 추가
