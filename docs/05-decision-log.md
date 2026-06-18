# 05. 의사결정 로그 (채택·기각·보류)

외부 피드백을 검토하며 **무엇을·왜** 채택/기각/보류했는지 추적하는 기록. 같은 논쟁의 재발을 막고, 설계 결정의 근거를 남기기 위함이다. 상충 분석의 원칙은 [03-synergy-conflict-design.md](03-synergy-conflict-design.md)를, 검증 절차는 [04-operational-validation.md](04-operational-validation.md)를 참조.

> 표기 규칙: 각 항목은 결정·근거를 1~2문장으로 적는다. 공식 문서로 확인된 사실과 수동 검증이 필요한 사항을 구분한다.

## 채택 (Accepted)

| 항목 | 근거 |
| --- | --- |
| handoffs 객체 형식(`label`/`agent`/`prompt`/`send`) | VS Code 공식 문서가 객체 배열 형식만 문서화한다. 문자열 배열은 표준이 아니므로 객체 형식으로 통일했다. |
| `target: vscode` 명시 | `target`은 실재하는 필드이며 값은 `vscode` 또는 `github-copilot`다. 이 하네스는 VS Code 대상이므로 의도를 명시적으로 선언했다. |
| 락파일 기반 패키지 매니저 추론 원칙 | `pnpm-lock.yaml`→pnpm 식으로 검증 명령을 추론하면 추측을 줄이고 잘못된 명령 실행을 막는다(구체 명령을 날조하지 않음). |
| scenarios 측정 지표 루브릭 | P7(검증=북극성)을 구호가 아니라 측정 가능하게 만든다. `test_pass`·`diff_size`·`self_fix_attempts` 등으로 하네스 구성 간 비교가 가능해진다. |

### 2026-06-18 갱신 — Agent hooks 정식 지원에 따른 전제 변경

이전 설계는 “GHCP엔 Claude Code식 hooks가 없다”는 전제로 기계적 강제를 보류했다. VS Code Copilot이 **Agent hooks(Preview, 8개 라이프사이클 이벤트)**를 정식 지원함이 공식 문서로 확인되어, 아래 항목을 **보류에서 채택으로 전환**한다.

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| Agent hooks로 기계적 강제 | 채택 | VS Code가 `SessionStart`/`UserPromptSubmit`/`PreToolUse`/`PostToolUse`/`PreCompact`/`SubagentStart`/`SubagentStop`/`Stop` 8개 이벤트를 `.github/hooks/*.json` 또는 에이전트 frontmatter로 지원. `exit 2`=차단, PreToolUse `permissionDecision`, Stop `decision:block`+`stop_hook_active`. Claude `.claude/settings.json` 포맷과 호환되어 마이그레이션이 직접적. |
| 보호 경로 가드(PreToolUse) | 채택 | 위험·불변 자산(단일 always-on 규칙, 확정된 결정 로그)의 직접 편집을 hook으로 차단. C1 위험 등급제를 “선언”에서 “강제”로 격상. |
| 검증 게이트(Stop) | 채택 | “검증 없는 완료 선언”을 Stop hook으로 차단(C8). `stop_hook_active`로 무한 루프 방지, git diff가 비면 자동 통과하는 자기해소형 가드. |
| 상태 레지스트리(`feature_list.json`) + 단일 변경 경로 | 채택 | JSON을 진행 상태의 정규 소스로 두고 변경은 `/finish` 프롬프트 하나로 일원화(wikidocs STEP 3/7). over-reach·under-finish와 상태 불일치를 막는다. |
| `harness-doctor` 거버넌스 검사 | 채택 | “문서가 주장하는 보호 ↔ hook이 실제 차단하는 보호”, 문서 수치 ↔ 실제 정합을 node 스크립트로 검사(wikidocs 원칙 6). docs 레포에서 node 실행으로 검증 가능하므로 런타임 코드 보류 사유가 해소됨. |
| self-eval 회피 규칙 | 채택 | LLM이 자기 검증을 후하게 통과시키는 실패 모드 대응 — 실제 명령 출력을 인용해서만 완료를 주장(wikidocs ⚠ 경고). |
| Claude 포맷 호환 명시 | 채택 | VS Code가 `.claude/agents`·`.claude/rules`·`.claude/settings.json`·`.claude/skills`·`CLAUDE.md`를 자동 인식. Claude Code 하네스 자산의 마이그레이션 경로를 문서에 명시. |

> 자제 원칙(중요): hooks가 가능해졌다고 전부 넣지 않는다. wikidocs 원칙(“관찰된 실패에서 하네스가 나온다”, ablation, 과도한 자동화 금지)에 따라 **이 레포에서 실제로 관찰·검증 가능한 강제만** 도입한다(상세: [03-synergy-conflict-design.md](03-synergy-conflict-design.md) C13).

| 항목 | 근거 |
| --- | --- |
| "frontmatter가 한 줄로 깨졌다"는 주장 | 바이트/라인 기준으로 검증한 결과 거짓이다. 모든 `.agent.md`·`.instructions.md`·`SKILL.md`의 YAML 경계가 정상이고 진단 오류가 0건이다. 다시 수정 대상으로 삼지 않는다. |
| `target: cloud` 값 | 잘못된 값이다. 유효 값은 `vscode` 또는 `github-copilot`뿐이므로 채택하지 않는다. |

### 2026-06-18 dogfood — 검증 앱 적용에서 관찰된 하네스 결정

하네스를 실제 앱 구현([../sandbox/task-cli](../sandbox/task-cli))에 적용(dogfood)하면서 관찰된 결정. 스티어링 루프([06 §2](06-harness-operating-plan.md))의 산출물이며, 관찰 근거는 [세션 저널](../sandbox/task-cli/HARNESS-SESSION-LOG.md)에 있다.

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| protect-paths 매칭을 레포 루트 정확 매칭으로 수정 | 채택 | 가드가 `endsWith("/feature_list.json")`로 매칭해 하위 프로젝트의 동명 파일(`sandbox/task-cli/feature_list.json`) 생성까지 `deny`로 **과발화**했다. 정당한 작업을 막는 C13 과발화 안티패턴의 재발(앞서 validate-docs에서 1회)이라, hook 위치 기준 `REPO_ROOT`를 도출해 cwd와 무관하게 루트 파일만 보호하도록 좁혔다. 검증: 루트 deny·하위 allow·cwd 무관·harness-doctor exit 0. |
| 검증 앱은 `sandbox/`에 두고 루트 하네스 게이트 밖에 둠 | 채택 | 루트 protect-paths/verify-done/harness-doctor는 **하네스 자산**만 강제 대상으로 한다. 앱은 자체 vitest로 검증하고, 루트 거버넌스를 침범하지 않는다(스코핑 의도 유지). |
| 검증 앱 추가로 축 ⑤(센서) 트리거 충족 → 경량 스모크만 도입 | 채택 | 앱(실행 대상)이 생겨 [06 §5](06-harness-operating-plan.md)의 ⑤ 도입 트리거가 충족됐다. 단 풀 CI는 과설계라, 앱 테스트를 루트에서 한 번에 돌리는 **스모크 스크립트 하나**만 추가한다([../scripts/smoke.mjs](../scripts/smoke.mjs)). 다중 앱·회귀 반복 관찰 시 확장. |

## 보류 (Deferred)

| 항목 | 근거 |
| --- | --- |
| repo-map 자동 생성 스크립트(tree-sitter/ctags) | 검증되지 않은 런타임 코드는 설계 우선 단계의 안정성을 해친다. 먼저 문서형 스킬([../.github/skills/repo-map/SKILL.md](../.github/skills/repo-map/SKILL.md))로 도입하고, 자동화는 이후 단계로 미룬다. |
| 클라우드(`target: github-copilot`) hooks·handoffs 검증 | 비대화형 클라우드 실행에서는 `handoffs`·일부 hook 이벤트 동작이 다를 수 있다. VS Code 대상으로 먼저 검증하고, 클라우드 이식은 별도 검증 단계로 둔다(상세: [02 §3.1](02-ghcp-harness-design.md)). |
| sandbox/runtime 구현 | 이 저장소는 자체 에이전트 런타임이 아니다. SWE-agent/OpenHands식 샌드박스·이벤트 루프·ACI를 직접 구현하지 않고, Copilot 커스터마이제이션 조합(policy harness)에 집중한다. |
