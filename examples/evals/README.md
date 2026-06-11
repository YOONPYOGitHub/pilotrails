# Evals (로드맵)

[../scenarios.md](../scenarios.md)의 드라이런 시나리오를 나중에 **실행 가능한 평가 매니페스트**(YAML/JSON)로 옮기기 위한 자리. 지금은 로드맵 문서만 둔다.

> 현재 단계에서는 **실행형 benchmark runner를 만들지 않는다**. 설계 우선 단계이고, 검증되지 않은 런타임 코드는 하네스 설계를 불안정하게 만들 수 있기 때문이다(근거: [docs/05-decision-log.md](../../docs/05-decision-log.md) 보류 항목).

## 목표

각 시나리오는 다음 필드를 갖춘 구조화된 케이스로 표현될 수 있다. [../scenarios.md](../scenarios.md)의 각 시나리오에 이미 같은 필드가 명시되어 있어, 그대로 매니페스트로 직렬화하면 된다.

| 필드 | 의미 |
| --- | --- |
| `entry_agent` | 시작 에이전트(Plan/Build/Ask) |
| `allowed_agents` | 호출 가능한 서브에이전트 allowlist |
| `forbidden_actions` | 금지 동작(예: Plan의 edit/execute) |
| `expected_artifacts` | 기대 산출물(테스트·diff·문서 등) |
| `pass_condition` | 통과 조건 |
| `fail_condition` | 실패 조건 |
| `metrics` | 기록할 측정 지표([../scenarios.md](../scenarios.md) 측정 지표 표) |

## 향후 형태 (예시 스케치, 미구현)

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

- 실행형 benchmark runner / 채점기
- GitHub Actions 연동 (→ [docs/02 §7](../../docs/02-ghcp-harness-design.md) 로드맵)
- 시나리오의 실제 YAML/JSON 매니페스트 파일 추가
