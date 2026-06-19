# PilotRails

Copilot-native rails for safe agentic coding.

PilotRails는 GitHub Copilot / VS Code Agent Mode를 위한 **AI 코딩 에이전트 governance harness**다. VS Code Copilot의 커스텀 에이전트·instructions·skills·Agent hooks를 조합해 **계획→탐색→구현→검증→완료** 흐름을 규율한다. 모델 런타임을 새로 만들지 않고 `.github/` 자산만으로 동작한다.

## Quick Start (clone & use)

PilotRails는 별도 설치형 프로그램이 아니라 VS Code Copilot이 읽는 커스터마이제이션 자산으로 동작한다. 이 저장소를 직접 확인하는 가장 빠른 길:

```bash
# 1) 이 저장소를 받는다
git clone https://github.com/YOONPYOGitHub/harness.git
cd harness

# 2) 거버넌스·hook 로직이 정상인지 확인(Node 18+)
node scripts/harness-doctor.mjs   # 기대: "OK — harness-doctor 통과"
node --test tests/                # 기대: hook 단위 테스트 통과
node scripts/smoke.mjs            # 기대: sandbox 앱 테스트/typecheck 통과(또는 대상 없음)
```

VS Code에서 이 저장소를 **워크스페이스 루트로 열면** 에이전트 선택기에 `Workspace` 출처의 Ask·Build·Plan이 표시된다. Explore는 Plan/Build가 호출하는 read-only 서브에이전트다. 해당 모드를 선택해 채팅하면 `.github/`의 에이전트·지침·스킬·hooks가 함께 적용된다.

## 다른 프로젝트에 적용하기

현재는 `pilotrails init` 같은 설치 CLI를 제공하지 않는다. 복사 방식으로 적용한다.

**권장: 거버넌스 포함 풀 번들**

다른 저장소에서도 `harness-doctor`, hook 테스트, CI까지 그대로 쓰려면 아래 묶음을 대상 저장소 루트로 복사한다.

```text
.github/
docs/
examples/
scripts/
tests/
feature_list.json
```

**경량 적용: Copilot 에이전트만 사용**

Plan/Build/Ask 같은 에이전트와 기본 지침만 쓰고, CI/doctor/smoke는 직접 맞출 계획이라면 아래만 먼저 옮길 수 있다.

```text
.github/agents/
.github/instructions/
.github/skills/
.github/prompts/
.github/copilot-instructions.md
```

이 경우 `.github/hooks/`, `.github/workflows/`, `scripts/harness-doctor.mjs`, `feature_list.json`은 대상 프로젝트 구조에 맞게 함께 옮기거나 조정해야 한다. 자세한 조작법은 [docs/08-run-harness.md](docs/08-run-harness.md)를 참고한다.

> 전제: VS Code + GitHub Copilot Chat. 기계적 강제(hooks)는 로컬 Agent hooks(Preview) 활성 시 작동하며, 비활성 환경에서는 선언적 정책으로 폴백한다. CI(`.github/workflows/harness-ci.yml`)는 push·PR마다 거버넌스 검사를 원격에서 강제한다.

라이선스: [MIT](LICENSE).

## 문서

문서는 **사용자용 → 설계·운영 → 배경 아카이브** 순서로 읽으면 된다.

### 사용자용

| 문서 | 내용 |
| --- | --- |
| [docs/00-harness-features.md](docs/00-harness-features.md) | PilotRails 기능 레퍼런스 — 모드 분리, 검증 루프, Agent hooks, 보호 경로, 상태 거버넌스 |
| [docs/08-run-harness.md](docs/08-run-harness.md) | PilotRails 실행·테스트 가이드 — clone 후 확인, VS Code에서 로드 확인, smoke 실행 |

### 설계·운영

| 문서 | 내용 |
| --- | --- |
| [docs/02-ghcp-harness-design.md](docs/02-ghcp-harness-design.md) | PilotRails 구조 — `.github/` 자산, 데이터 흐름, 보호 경로, CI/doctor 정합성 |
| [docs/04-operational-validation.md](docs/04-operational-validation.md) | 운영 검증 체크리스트 — VS Code/Copilot에서 실제 인식 여부 확인 |
| [docs/06-harness-operating-plan.md](docs/06-harness-operating-plan.md) | 운영 원칙 — 관찰된 실패 기반 개선, 검증 게이트, 확장 기준 |

### 배경·아카이브

| 문서 | 내용 |
| --- | --- |
| [docs/01-harness-research.md](docs/01-harness-research.md) | 설계 배경 리서치 — AI coding harness 문제 공간과 참고한 설계 패턴 |
| [docs/03-synergy-conflict-design.md](docs/03-synergy-conflict-design.md) | 설계 결정 근거 — 채택/비채택 판단 기준과 상충 해소 원칙 |
| [docs/05-decision-log.md](docs/05-decision-log.md) | 결정 로그 — 보호 경로, hooks, CI, 문서 정책의 결정 근거 |
| [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md) | 보류 백로그 — 지금 넣지 않는 확장 후보와 도입 트리거 |

## 설계 핵심

- **3 모드**: Plan(읽기 전용 탐색) · Build(편집+검증) · Ask(Q&A) — `*.agent.md`의 `tools` 허용 목록으로 강제
- **Explore 서브에이전트**: 광범위 탐색을 격리해 메인 컨텍스트 보호(읽기 전용, `agents` allowlist)
- **검증 루프**: 기준선 → 편집 → 진단 → 테스트 → 자기수정(신규 실패만, 최대 2회) → 에스컬레이트
- **메모리 표준**: 항상 로딩 파일은 **단 하나**(`copilot-instructions.md` 또는 `AGENTS.md` — 둘 다 쓰지 않음) + 경로별 `*.instructions.md` + 온디맨드 `SKILL.md`

## 구현·운영 파일

PilotRails 본체는 VS Code/Copilot이 인식하는 `.github/` 자산이고, `scripts/`·`tests/`·`sandbox/`는 그 자산을 검증하고 설명하기 위한 보조 계층이다.

| 파일 | 역할 |
| --- | --- |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | 단일 always-on 전역 규칙(불변용 최소 규칙) |
| [.github/agents/plan.agent.md](.github/agents/plan.agent.md) | Plan — 읽기 전용 탐색·계획(`[read, search, web, agent]`) |
| [.github/agents/build.agent.md](.github/agents/build.agent.md) | Build — 구현+검증(`[read, search, edit, execute, todo, agent]`) |
| [.github/agents/ask.agent.md](.github/agents/ask.agent.md) | Ask — 읽기 전용 Q&A(`[read, search, web]`) |
| [.github/agents/explore.agent.md](.github/agents/explore.agent.md) | Explore — 서브에이전트(`[read, search]`, user-invocable:false) |
| [.github/instructions/typescript.instructions.md](.github/instructions/typescript.instructions.md) · [.github/instructions/tests.instructions.md](.github/instructions/tests.instructions.md) · [.github/instructions/docs.instructions.md](.github/instructions/docs.instructions.md) | 경로별 규칙(typescript·tests·docs, `applyTo`) |
| [.github/skills/](.github/skills/) | 온디맨드 절차(test-debugging·release-checklist·repo-map) |
| [.github/hooks/](.github/hooks/) | **기계적 강제**(Agent hooks) — PreToolUse 보호경로 차단·PostToolUse 포맷 검사·Stop 검증 게이트 |
| [.github/workflows/harness-ci.yml](.github/workflows/harness-ci.yml) | **CI 검증** — push·PR마다 harness-doctor·hook 테스트·스모크를 원격 강제(로컬 Preview 의존 보완) |
| [.github/prompts/finish.prompt.md](.github/prompts/finish.prompt.md) | `/finish` — 검증→상태 갱신→handoff→커밋 단일 완료 경로 |
| [feature_list.json](feature_list.json) | PilotRails 자산 상태의 단일 정본(canonical state) |
| [scripts/harness-doctor.mjs](scripts/harness-doctor.mjs) | 거버넌스 검사 — 문서↔훅 보호경로·문서 번호·사장 자산 정합 (`node`로 실행) |
| [scripts/smoke.mjs](scripts/smoke.mjs) | 검증 앱 스모크 — `sandbox/*` 앱 테스트를 루트에서 일괄 실행(경량 센서) |
| [tests/hooks.test.mjs](tests/hooks.test.mjs) | hook 순수 로직 단위 테스트(`node --test`, 보호 경로 평가·문서 링크 검사) |
| [.github/SECURITY.md](.github/SECURITY.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [.github/CODEOWNERS](.github/CODEOWNERS) | 공개 협업 위생 — 보안 제보·기여 가이드·코드 오너 |
| [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) · [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) | 이슈·PR 템플릿(실행 표면·에이전트·Preview 상태·검증 증거 강제) |
| [.github/workflows/codeql.yml](.github/workflows/codeql.yml) · [.github/dependabot.yml](.github/dependabot.yml) | 보안 기본선 — 정적분석(CodeQL)·의존성 업데이트 |
| [sandbox/task-cli/](sandbox/task-cli/) · [sandbox/expense-cli/](sandbox/expense-cli/) | PilotRails dogfood 검증 앱(Task CLI · Expense CLI) + 각 세션 저널 |
| [examples/scenarios.md](examples/scenarios.md) | 5개 드라이런 시나리오(버그·기능·리팩터링·테스트·문서) |

> **인벤토리 범위**: [feature_list.json](feature_list.json)은 **PilotRails 자신의 정책 자산**(agents·instructions·skills·hooks·prompts·doctor·scenarios)만 정본으로 담는다. `scripts/smoke.mjs`·`sandbox/*`·`examples/evals/`는 **검증·시연용 보조 자산**이므로 의도적으로 인벤토리 밖에 둔다(PilotRails 구성과 먼 생명주기를 분리).

## Scope and non-goals

**현재 보장하는 것**

- PilotRails는 `target: vscode` 중심이다. VS Code 대화형 워크플로(handoffs 버튼, 서브에이전트 호출)을 전제로 설계됐다.
- 항상 로드되는 전역 지침은 [.github/copilot-instructions.md](.github/copilot-instructions.md) **하나로** 유지한다. `AGENTS.md`는 현재 추가하지 않는다(이중 항상로딩은 안티패턴).
- PilotRails의 현재 목표는 Copilot custom agents·instructions·skills를 조합한 **policy harness**다.

**현재 보장하지 않는 것 (non-goals)**

- 이 저장소는 **자체 에이전트 런타임이 아니다.** sandbox·event-loop·ACI를 직접 구현하지 않고, VS Code Copilot 커스터마이징 계층에 집중한다.
- GitHub Copilot **cloud agent는 future target**이며, `handoffs`·`web`·`todo`·hooks 동작 차이가 있으므로 별도 검증 전에는 동일 동작을 보장하지 않는다(상세: [docs/02 §3.1](docs/02-ghcp-harness-design.md)).
- 기계적 강제는 **로컬 Agent hooks Preview**에 의존한다. 기능 비활성 환경에서는 hook이 선언적 정책으로만 작동하고 자동 차단은 일어나지 않는다.
- **CI 검증**(harness-doctor·hook 단위 테스트·스모크)은 [.github/workflows/harness-ci.yml](.github/workflows/harness-ci.yml)로 push·PR마다 원격 강제된다(로컬 Agent hooks Preview 의존을 보완). 다만 GitHub Copilot **cloud agent의 원격 강제**와 sandbox guardrail은 현재 보장하지 않으며, [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md)에 보류 조건을 기록한다.

## 상태

PilotRails는 `.github/` 에이전트·규칙·스킬·**hooks**, [feature_list.json](feature_list.json), [scripts/harness-doctor.mjs](scripts/harness-doctor.mjs)까지 구축되어 동작한다. 기계적 강제는 로컬 Agent hooks(Preview)와 **CI 검증**([.github/workflows/harness-ci.yml](.github/workflows/harness-ci.yml))로 이중화된다. 향후 확장은 [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md)의 도입 트리거를 충족할 때 재검토한다.
