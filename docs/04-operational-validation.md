# 04. 운영 검증 체크리스트 (수동)

이 문서는 [.github/](../.github/)의 하네스 구성이 **실제 VS Code/Copilot에서 의도대로 로드·동작하는지** 사람이 직접 확인하는 절차다. 실행 스크립트가 아니라 **수동 검증 절차**로 유지한다(설계 우선 단계, 검증되지 않은 런타임 코드 미추가 — 근거: [03-synergy-conflict-design.md](03-synergy-conflict-design.md) §6 불변 규칙).

> 전제: VS Code + GitHub Copilot Chat이 설치되어 있고, 이 저장소를 워크스페이스로 연 상태. 커스텀 에이전트는 워크스페이스의 [.github/agents/](../.github/agents/) 폴더에서 자동 인식된다.

확인 기준(`checked_at`)은 검증을 수행한 날짜와 VS Code/Copilot 버전을 함께 적는다. 아래 표의 "결과"·"비고"는 검증 시점에 채운다.

## A. Diagnostics 뷰 확인

채팅 뷰에서 **우클릭 → Diagnostics**(Chat customization diagnostics)를 열어 로드된 커스터마이제이션과 오류를 본다.

| # | 확인 항목 | 기대 결과 | 결과 | 비고 |
| --- | --- | --- | --- | --- |
| 1 | Plan, Build, Ask, Explore 4개 에이전트 로드 | 4개 모두 목록에 표시 |  |  |
| 2 | [.github/copilot-instructions.md](../.github/copilot-instructions.md) 로드 | always-on 지침으로 표시 |  |  |
| 3 | [.github/instructions/](../.github/instructions/)의 `*.instructions.md` 로드 | typescript·tests·docs 3개 표시 |  |  |
| 4 | [.github/skills/](../.github/skills/)의 `*/SKILL.md` 로드 | test-debugging·release-checklist·repo-map 표시 |  |  |
| 5 | 오류·무시된(ignored) 필드 없음 | 오류 0건, ignored 필드 0건 |  |  |

## B. Agent picker 확인

채팅 입력창의 에이전트 드롭다운(`/agents` 또는 Configure Custom Agents)에서 확인한다.

| # | 확인 항목 | 기대 결과 | 결과 | 비고 |
| --- | --- | --- | --- | --- |
| 6 | Plan, Build, Ask가 picker에 보임 | 3개 모두 선택 가능 |  |  |
| 7 | Explore는 picker에 보이지 않음 | `user-invocable: false`라 숨김 |  |  |

## C. 권한 제한 확인

각 에이전트를 선택한 뒤, 사용 가능한 도구 목록(또는 실제 호출 시도)으로 확인한다. 근거: "도구가 `tools`에 없으면 무시된다"(공식 문서).

| # | 확인 항목 | 기대 결과 | 결과 | 비고 |
| --- | --- | --- | --- | --- |
| 8 | Plan은 `read`/`search`/`web`/`agent`만, `edit`/`execute` 없음 | 편집·실행 불가 |  |  |
| 9 | Ask는 `read`/`search`/`web`만 | 편집·실행·서브에이전트 불가 |  |  |
| 10 | Build만 `edit`/`execute`/`todo` 보유 | 편집·실행·할일 추적 가능 |  |  |
| 11 | Explore는 `read`/`search`만 | 탐색 전용 |  |  |

## D. Subagent 확인

Plan/Build에서 서브에이전트 호출을 시도해 확인한다. 근거: 호출측 `tools`에 `agent` 포함 + `agents` allowlist.

| # | 확인 항목 | 기대 결과 | 결과 | 비고 |
| --- | --- | --- | --- | --- |
| 12 | Plan·Build가 Explore를 서브에이전트로 호출 가능 | `agents: [Explore]`로 호출됨 |  |  |
| 13 | Explore 외 다른 서브에이전트는 호출 불가 | allowlist 밖은 차단 |  |  |

## E. Handoff 확인

Plan 에이전트로 계획을 완료한 뒤 응답 하단의 handoff 버튼을 확인한다. 근거: handoffs는 응답 완료 후 나타나는 **VS Code 채팅 UI 버튼**이다.

| # | 확인 항목 | 기대 결과 | 결과 | 비고 |
| --- | --- | --- | --- | --- |
| 14 | Plan 완료 후 "Build 시작" handoff 버튼 표시 | 버튼 노출 |  |  |
| 15 | 버튼 선택 시 프롬프트가 **자동 전송되지 않음** | `send: false`라 프롬프트만 채워짐 |  |  |

## F. 실패 시 기록 양식

검증 중 하나라도 기대와 다르면 아래 양식으로 기록한 뒤, 최소 수정 또는 에스컬레이션한다.

| # | 기록 항목 | 내용 |
| --- | --- | --- |
| 16 | 인식되지 않은 파일/필드 | 예: `plan.agent.md`의 `handoffs` |
| 17 | 문제가 난 에이전트 | 예: Plan |
| 18 | VS Code Diagnostics 메시지 | 원문 그대로 |
| 19 | 수정 여부와 이유 | 수정함/보류함 + 근거 |

> 이 체크리스트는 자동화 대상이 아니다. 향후 일부 항목을 실행형으로 옮긴다면 [02-ghcp-harness-design.md](02-ghcp-harness-design.md) §7 로드맵의 CI 하네스 단계에서 다룬다. 현재는 수동 검증만 수행한다.
