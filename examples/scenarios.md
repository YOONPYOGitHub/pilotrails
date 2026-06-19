# 드라이런 시나리오

설계([docs/](../docs/))와 구현([.github/](../.github/))이 실제 작업에서 어떻게 맞물리는지 보여주는 5개 시나리오.
각 시나리오는 **모드 흐름 · 사용하는 에이전트/도구 · 적용되는 불변 규칙(C1~C9)**을 보여준다.

> 공통 전제: 항상 로드되는 규칙은 [.github/copilot-instructions.md](../.github/copilot-instructions.md). 모드는 [.github/agents/](../.github/agents/)의 커스텀 에이전트.

---

## 1. 버그 수정 (작고 가역적)

**상황**: "로그인 후 빈 화면이 뜬다"는 버그 리포트.

| 단계 | 모드 | 도구 | 핵심 |
| --- | --- | --- | --- |
| 1 | Plan | `search`, (필요 시) `agent`→Explore | 증상 재현 경로와 의심 파일 좁히기. 완료 기준 = "재현 테스트가 통과" |
| 2 | Build | `execute` | **기준선**: 관련 테스트 1회 실행, 기존 실패 기록 (C8) |
| 3 | Build | `edit` → 진단 → `execute` | 재현 테스트 작성 → 수정 → 통과 확인 |
| 4 | Build | `execute` | 검증 통과 후에만 커밋 (C9) |

**적용 규칙**: 가역·저영향이라 자율 진행(C1). 신규 실패만 수정, 기존 실패는 기록만(C8).

**평가 필드**

- `entry_agent`: Plan
- `allowed_agents`: [Explore]
- `forbidden_actions`: Plan 단계의 edit/execute
- `expected_artifacts`: 재현 테스트, 수정 diff
- `pass_condition`: 재현 테스트 통과 + 신규 실패 0
- `fail_condition`: 신규 실패 발생 또는 자가수정 2회 초과
- `metrics`: test_pass, diff_size, self_fix_attempts, new_failures_introduced

---

## 2. 작은 기능 추가

**상황**: "설정 화면에 다크 모드 토글 추가."

| 단계 | 모드 | 도구 | 핵심 |
| --- | --- | --- | --- |
| 1 | Plan | `search`, `web` | 기존 테마 처리 위치 파악, 접근법 1~2개 비교 후 추천 |
| 2 | Plan → Build | `handoffs` | 계획 승인 후 Build로 전환(작업 경계) |
| 3 | Build | `todo` | 다단계 작업 분해, 한 번에 하나 in-progress |
| 4 | Build | `edit`, `execute` | 구현 → 토글 동작 테스트 추가 → 검증 루프 |

**적용 규칙**: 계획은 채팅/PR 설명 같은 스크래치에 남김(C2 — always-on 파일엔 넣지 않음). 모드 전환은 작업 경계에서만(C4).

**평가 필드**

- `entry_agent`: Plan → Build
- `allowed_agents`: [Explore]
- `forbidden_actions`: Plan 단계의 edit/execute, 계획을 always-on 파일에 기록
- `expected_artifacts`: 토글 구현 diff, 동작 테스트
- `pass_condition`: 기능 동작 테스트 통과 + 신규 실패 0
- `fail_condition`: 신규 실패 발생 또는 모드 경계 외 전환
- `metrics`: test_pass, diff_size, agent_loops

---

## 3. 대형 리팩터링 (광범위·주의 요함)

**상황**: "결제 모듈을 새 API로 마이그레이션."

| 단계 | 모드 | 도구 | 핵심 |
| --- | --- | --- | --- |
| 1 | Plan | `agent`→Explore(thorough) | 광범위 탐색을 **격리된 컨텍스트**에 위임해 메인 보호 (C2, C3) |
| 2 | Plan | — | 영향 범위·리스크·단계별 순서 산출. 큰 산출물은 파일/구조로 가리킴 |
| 3 | Build | `todo`, `edit`, `execute` | 작은 단위로 쪼개 **각 단위마다 검증 통과 시 커밋**(green = 롤백 지점, C9) |
| 4 | Build | — | 비가역 단계(브랜치 삭제·force-push 등)는 [release-checklist](../.github/skills/release-checklist/SKILL.md)로 승인 게이트 통과 (C1) |

**적용 규칙**: 코드 작성은 절대 위임하지 않음 — Explore는 read-only 탐색만(C3). 큰 변경일수록 외과적으로, 정리는 별도 PR(D6).

**평가 필드**

- `entry_agent`: Plan
- `allowed_agents`: [Explore]
- `forbidden_actions`: 코드 작성 위임, 비가역 단계 무승인 실행
- `expected_artifacts`: repo map 갱신, 단계별 커밋, 마이그레이션 diff
- `pass_condition`: 각 단위 검증 통과 후 커밋, 신규 실패 0
- `fail_condition`: 비가역 작업 무승인 실행 또는 단위 검증 실패 누적
- `metrics`: diff_size, human_interventions, new_failures_introduced

---

## 4. 테스트 실패 디버깅

**상황**: "CI에서 3개 테스트가 빨갛게 뜬다."

| 단계 | 모드 | 도구/스킬 | 핵심 |
| --- | --- | --- | --- |
| 1 | Build | [test-debugging](../.github/skills/test-debugging/SKILL.md) | 스킬 절차대로 기준선 수립 |
| 2 | Build | `execute` | 실패를 신규 vs 기존(pre-existing)으로 분류 |
| 3 | Build | `edit`, `execute` | 신규 실패만, 한 번에 한 가설로 수정 |
| 4 | Build | — | 같은 실패 자가수정 **최대 2회** → 안 되면 로그·diff·가설 동봉해 에스컬레이션 (C8) |

**적용 규칙**: 검증 루프 상한이 핵심. 추측으로 무한히 헤집지 않음(C8).

**평가 필드**

- `entry_agent`: Build
- `allowed_agents`: [Explore]
- `forbidden_actions`: 기존(pre-existing) 실패 수정, 자가수정 2회 초과
- `expected_artifacts`: 신규/기존 실패 분류표, 수정 diff, (초과 시) [실패 리포트](../.github/skills/test-debugging/templates/failure-report.md)
- `pass_condition`: 신규 실패 해소 + 기존 실패 보존
- `fail_condition`: 자가수정 2회 초과 후에도 동일 접근 반복
- `metrics`: self_fix_attempts, new_failures_introduced, test_pass

---

## 5. 문서 편집

**상황**: "README의 설치 안내를 최신화."

| 단계 | 모드 | 도구 | 핵심 |
| --- | --- | --- | --- |
| 1 | Ask 또는 Build | `read`, `search` | 현재 안내와 실제 동작의 차이 확인 |
| 2 | Build | `edit` | [docs.instructions.md](../.github/instructions/docs.instructions.md) 규칙 적용(파일 링크, 표 포맷, 출처 표기) |
| 3 | Build | — | 명령·경로가 실제와 일치하는지 확인 후 커밋 |

**적용 규칙**: 문서도 "근거 있는 변경". 미검증 수치는 "미검증"으로 표기.

**평가 필드**

- `entry_agent`: Ask 또는 Build
- `allowed_agents`: (없음)
- `forbidden_actions`: 미검증 수치 단정, 백틱 파일명
- `expected_artifacts`: 문서 diff
- `pass_condition`: 명령·경로가 실제와 일치, 링크·표 포맷 준수
- `fail_condition`: 미검증 수치를 검증된 것처럼 표기
- `metrics`: diff_size, human_interventions

---

## 측정 지표 (PilotRails 실행 평가용)

P7(검증=북극성)을 구호가 아니라 **측정 가능**하게 만드는 루브릭. 위 시나리오를 실제로 돌릴 때 아래 지표를 기록하면 PilotRails 구성 간 비교가 가능하다.

| 지표 | 정의 | 좋은 방향 |
| --- | --- | --- |
| `test_pass` | 관련 테스트 최종 통과 여부 | 통과 |
| `diff_size` | 변경 라인 수(추가+삭제) | 작을수록(외과적) |
| `self_fix_attempts` | 같은 실패 자가수정 횟수 | ≤ 2 (상한, C8) |
| `new_failures_introduced` | 내 변경이 유발한 신규 실패 수 | 0 |
| `agent_loops` | 편집→검증 반복 횟수 | 적을수록 |
| `human_interventions` | 사람이 개입·승인한 횟수 | 비가역 작업에서만 |

> 이 지표는 SWE-bench식 "패치+테스트 통과" 사고를 로컬 작업에 옮긴 것이다. 측정값을 남기면 모드 분리·검증 루프 상한 같은 설계 결정이 실제로 효과가 있는지 사후 검증할 수 있다.

---

> 이 시나리오들은 [docs/02 §3](../docs/02-ghcp-harness-design.md)의 컴포넌트 설계와 [docs/03 §6](../docs/03-synergy-conflict-design.md)의 다이얼 기본 구성을 실제 작업 흐름으로 보여주기 위한 것이다.
