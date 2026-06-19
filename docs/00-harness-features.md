# 하네스 기능 레퍼런스 (현재 동작 기준)

이 문서는 GHCP 하네스가 **지금 무엇을 하는가**를 기능 중심으로 정리한다. 설계 근거·외부 사례 비교는 [01-harness-research.md](01-harness-research.md) 이하 배경 문서에 있고, 여기서는 **현재 저장소에 구현되어 동작하는 기능**만 다룬다.

> 한 줄 요약: 별도 런타임을 만들지 않고 `.github/` 커스터마이제이션만으로 **계획 → 구현 → 검증 → 완료**를 규율로 강제하는 정책 레이어다.

## 1. 모드 분리 (3 + 1)

작업 성격에 따라 권한이 다른 에이전트를 골라 쓴다. 각 모드는 `*.agent.md`의 `tools` 허용목록으로 **할 수 있는 일이 물리적으로 제한**된다.

| 모드 | 용도 | 도구 권한 |
| --- | --- | --- |
| [Plan](../.github/agents/plan.agent.md) | 읽기 전용 탐색·계획 수립 | `read, search, web, agent` (편집 불가) |
| [Build](../.github/agents/build.agent.md) | 구현 + 검증 | `read, search, edit, execute, todo, agent` |
| [Ask](../.github/agents/ask.agent.md) | 읽기 전용 Q&A | `read, search, web` |
| [Explore](../.github/agents/explore.agent.md) | 광범위 탐색 서브에이전트 | `read, search` (사용자 직접 호출 불가) |

- **코드 작성은 단일 스레드(Build)가 독점**한다. 서브에이전트(Explore)는 read-only 전용이라 쓰기를 위임하지 않는다.
- Explore는 넓은 탐색을 **격리된 컨텍스트**에서 수행해 메인 대화의 load-bearing 컨텍스트를 보호한다.

## 2. 검증 루프 (완료의 정의)

"컴파일된다"가 아니라 **(1) 변경을 diff로 명확히 하고 (2) 관련 테스트를 실제로 돌려 통과**해야 완료다.

```
기준선(테스트·진단 1회) → 편집 → 진단(get_errors) → 테스트(execute)
   → 신규 실패만 자가수정(최대 2회)
   → 안 되면 동일 접근 중단 + 로그·diff·가설 동봉해 에스컬레이트
```

- **기준선 우선**: 이미 깨져 있던(pre-existing) 실패는 건드리지 않고 기록만 한다.
- **신규 실패만** 고친다. 같은 실패 자가수정은 **최대 2회**로 상한.
- 테스트가 없으면 `재현 → 수정 → 회귀 방지 테스트 추가`.

## 3. 기계적 강제 — Agent Hooks

선언적 규칙("에이전트가 따라줄 것")을 넘어, 일부 규칙은 [.github/hooks/](../.github/hooks/)가 **기계적으로 강제**한다. `hooks.json`이 라이프사이클 이벤트에 스크립트를 배선한다.

| 이벤트 | 스크립트 | 하는 일 |
| --- | --- | --- |
| `SessionStart` | [session-ready.mjs](../.github/hooks/session-ready.mjs) | 최신 handoff·하네스 상태를 세션 시작 시 주입 |
| `PreToolUse` | [protect-paths.mjs](../.github/hooks/protect-paths.mjs) | **보호 경로 차단** — 비가역·불변 자산 편집을 deny/ask |
| `PostToolUse` | [validate-docs.mjs](../.github/hooks/validate-docs.mjs) | 문서 편집 후 링크·포맷 검사 |
| `PreCompact` | [precompact-handoff.mjs](../.github/hooks/precompact-handoff.mjs) | 압축 직전 load-bearing 컨텍스트를 handoff 초안으로 덤프 |
| `Stop` | [verify-done.mjs](../.github/hooks/verify-done.mjs) | **"검증 없는 완료" 차단** — 미커밋 + 자산 변경 시 게이트 |

> 기계적 강제는 로컬 **Agent hooks(Preview)** 활성 시 작동한다. 비활성 환경에서는 같은 규칙이 선언적 정책으로 폴백하고, [CI](../.github/workflows/harness-ci.yml)가 push·PR마다 원격에서 보완 강제한다.

## 4. 보호 경로 (비가역 자산 가드)

[protect-paths.mjs](../.github/hooks/protect-paths.mjs)는 정해진 경로의 편집을 차단한다. `exact`(정확 일치)와 `prefix`(접두 일치) 두 매칭을 지원한다.

| 경로 | 결정 | 이유 |
| --- | --- | --- |
| `feature_list.json` | deny | 상태 단일 정본 — `/finish`로만 변경 |
| `.github/copilot-instructions.md` | ask | always-on 전역 규칙 |
| `docs/05-decision-log.md` | ask | 결정 이력 보존 |
| `.github/hooks/` (prefix) | ask | 가드 자신을 보호 |

> 새 보호 경로를 추가하면 그 문자열이 [02 §3.9](02-ghcp-harness-design.md)에 명시돼 있어야 [harness-doctor](../scripts/harness-doctor.mjs)가 통과한다(문서↔훅 정합 검사).

## 5. 상태 거버넌스 (단일 경로)

- 하네스 자산 상태의 **단일 정본은 [feature_list.json](../feature_list.json)**.
- `status` 변경은 [/finish](../.github/prompts/finish.prompt.md) **한 경로로만** 한다(검증 → 상태 갱신 → handoff → 커밋).
- 직접 편집은 `PreToolUse` 가드가 차단한다.

## 6. 메모리 표준

- **항상 로딩 파일은 단 하나** — [copilot-instructions.md](../.github/copilot-instructions.md)에 변하지 않는 최소 불변 규칙만 둔다(`AGENTS.md`와 동시 사용 금지).
- 경로별 규칙은 [.github/instructions/](../.github/instructions/)의 `*.instructions.md`가 `applyTo` 글롭으로 해당 파일에만 적용.
- 자주 쓰는 절차는 [.github/skills/](../.github/skills/)의 `SKILL.md`로 온디맨드 로딩.

## 7. 자기 진단 (드리프트 방지)

하네스 자신이 문서와 어긋나는 것을 센서로 막는다. 빌드 러너 없이 `node`로 실행한다.

| 명령 | 검사 내용 |
| --- | --- |
| `node scripts/harness-doctor.mjs` | 문서↔훅 보호경로 정합, 문서 수치 일치, 죽은 자산 탐지 |
| `node --test tests/` | hook 순수 로직 단위 테스트(보호경로 평가·문서 링크) |
| `node scripts/smoke.mjs` | `sandbox/*` 검증 앱 테스트 일괄 실행 |

## 8. 위험 등급제

- **가역·저영향**(파일 편집, 읽기, 테스트 실행)은 자율 진행.
- **비가역·공유 영향**(push, `--force`, `reset --hard`, 파일·브랜치 삭제, 인프라 변경, 비밀 취급)은 항상 사용자 승인.

---

더 깊은 설계 근거는 [02 설계서](02-ghcp-harness-design.md)·[03 시너지/상충](03-synergy-conflict-design.md)을, 직접 굴려보는 법은 [HOWTO-run-harness.md](HOWTO-run-harness.md)를 본다.
