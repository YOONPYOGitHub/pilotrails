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

## 기각 (Rejected)

| 항목 | 근거 |
| --- | --- |
| "frontmatter가 한 줄로 깨졌다"는 주장 | 바이트/라인 기준으로 검증한 결과 거짓이다. 모든 `.agent.md`·`.instructions.md`·`SKILL.md`의 YAML 경계가 정상이고 진단 오류가 0건이다. 다시 수정 대상으로 삼지 않는다. |
| `target: cloud` 값 | 잘못된 값이다. 유효 값은 `vscode` 또는 `github-copilot`뿐이므로 채택하지 않는다. |

## 보류 (Deferred)

| 항목 | 근거 |
| --- | --- |
| repo-map 자동 생성 스크립트(tree-sitter/ctags) | 검증되지 않은 런타임 코드는 설계 우선 단계의 안정성을 해친다. 먼저 문서형 스킬([../.github/skills/repo-map/SKILL.md](../.github/skills/repo-map/SKILL.md))로 도입하고, 자동화는 이후 단계로 미룬다. |
| hooks / CI enforcement | 위험 게이트의 강제 실행은 별도 인프라(GitHub Actions·PreToolUse hook)를 요구한다. 현재는 프롬프트 정책으로 두고 [02-ghcp-harness-design.md](02-ghcp-harness-design.md) §7 로드맵에서 다룬다. |
| sandbox/runtime 구현 | 이 저장소는 자체 에이전트 런타임이 아니다. SWE-agent/OpenHands식 샌드박스·이벤트 루프·ACI를 직접 구현하지 않고, Copilot 커스터마이제이션 조합(policy harness)에 집중한다. |
