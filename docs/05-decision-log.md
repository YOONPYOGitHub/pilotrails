# 결정 로그

이 문서는 PilotRails의 주요 결정과 근거를 간단히 기록한다. 긴 설계 논쟁은 [03-synergy-conflict-design.md](03-synergy-conflict-design.md), 현재 보류 항목은 [07-deferred-backlog.md](07-deferred-backlog.md)를 본다.

## 현재 채택한 결정

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 제품명 | PilotRails | Copilot Agent Mode 위에 안전한 작업 rails를 얹는 제품 정체성을 드러낸다. |
| 전역 지침 | [.github/copilot-instructions.md](../.github/copilot-instructions.md) 하나만 사용 | always-on 컨텍스트 중복과 충돌을 줄인다. |
| 모드 구조 | Plan / Build / Ask + Explore | 탐색, 구현, 질문, 넓은 탐색의 책임을 분리한다. |
| 서브에이전트 | Explore는 read-only | 코드 작성 책임을 분산하지 않는다. |
| 상태 정본 | [feature_list.json](../feature_list.json) | PilotRails 정책 자산의 상태를 한 곳에서 관리한다. |
| 완료 경로 | [/finish](../.github/prompts/finish.prompt.md) | 검증, 상태 갱신, handoff, 커밋을 한 흐름으로 묶는다. |
| 보호 경로 | `feature_list.json`, `.github/copilot-instructions.md`, `docs/05-decision-log.md`, `.github/hooks/` | 상태·전역 규칙·결정 로그·가드 스크립트를 보호한다. |
| 문서 검사 | 상대 링크 검사는 경고 중심 | 문서 편집 중 과도한 차단을 피하면서 깨진 링크를 드러낸다. |
| CI | doctor, hook tests, smoke 실행 | 로컬 hooks 비활성 환경에서도 최소 정합성을 확인한다. |

## 현재 보류한 결정

| 항목 | 상태 | 재검토 위치 |
| --- | --- | --- |
| init/pack CLI | 보류 | [07-deferred-backlog.md](07-deferred-backlog.md) |
| MCP/Playwright 통합 | 보류 | [07-deferred-backlog.md](07-deferred-backlog.md) |
| 텔레메트리/run log | 보류 | [07-deferred-backlog.md](07-deferred-backlog.md) |
| 플러그인/manifest | 보류 | [07-deferred-backlog.md](07-deferred-backlog.md) |
| eval 실행기 | 보류 | [07-deferred-backlog.md](07-deferred-backlog.md) |
| devcontainer | 보류 | [07-deferred-backlog.md](07-deferred-backlog.md) |

## 로그 관리 원칙

- 결정은 길게 설명하기보다, 사용자가 영향을 받는 정책과 근거만 남긴다.
- 이미 채택한 결정이 바뀌면 이 문서와 관련 기능 문서를 함께 갱신한다.
- 보호 경로 변경은 [02-ghcp-harness-design.md](02-ghcp-harness-design.md)와 hook 구현을 함께 수정해야 한다.
