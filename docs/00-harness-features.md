# PilotRails 기능 레퍼런스

이 문서는 PilotRails를 clone했을 때 바로 사용할 수 있는 커스터마이징 자산과 운영 규칙을 설명한다.

## 1. Copilot-native 정책 레이어

PilotRails는 별도 에이전트 런타임이 아니다. VS Code Copilot이 인식하는 `.github/` 자산을 조합해, 대화형 코딩 작업에 다음 규칙을 얹는다.

- 작업을 **계획 -> 구현 -> 검증 -> 완료** 흐름으로 나눈다.
- 파일 종류와 작업 단계에 따라 **다른 지침**을 로드한다.
- 일부 규칙은 Agent hooks와 CI로 **기계적으로 검사**한다.
- 상태 변경과 완료 처리를 한 경로로 모아 운영 드리프트를 줄인다.

## 2. 작업 모드

| 모드 | 역할 | 핵심 제한 |
| --- | --- | --- |
| Plan | 읽기 전용 탐색과 실행 계획 수립 | 파일 편집·명령 실행 없음 |
| Build | 구현, 테스트, 검증 루프 수행 | 쓰기는 메인 에이전트가 단일 스레드로 수행 |
| Ask | 코드 변경 없는 질문 답변 | 읽기·검색 중심 |
| Explore | 넓은 코드베이스 탐색 서브에이전트 | read-only, 사용자 직접 호출 없음 |

모드 정의는 [.github/agents/](../.github/agents/)에 있다. 실제 VS Code에서 인식되는지 확인하는 절차는 [04-operational-validation.md](04-operational-validation.md)를 따른다.

## 3. 검증 루프

완료 기준은 "응답이 그럴듯한가"가 아니라 **실제 검증 명령이 통과했는가**다.

```text
기준선 확인 -> 편집 -> 진단 -> 테스트 -> 신규 실패만 수정 -> 통과 증거 기록
```

- 수정 전 기준선을 잡아 기존 실패와 신규 실패를 구분한다.
- 같은 실패를 반복 수정하는 횟수는 제한한다.
- 테스트가 없으면 재현 테스트나 최소 검증 절차를 먼저 만든다.
- 완료 보고에는 실행한 명령과 결과를 남긴다.

## 4. Agent hooks 기반 가드

[.github/hooks/](../.github/hooks/)는 로컬 Agent hooks(Preview)가 활성화된 환경에서 일부 규칙을 자동 검사한다.

| 영역 | 동작 |
| --- | --- |
| 보호 경로 | 핵심 파일 직접 편집을 deny/ask로 차단 |
| 문서 검사 | 마크다운 상대 링크 깨짐을 경고 |
| 완료 게이트 | 검증 없이 PilotRails 자산 변경을 끝내는 흐름을 차단 |
| 컨텍스트 보존 | 세션 시작·압축 직전에 필요한 상태를 주입 |

hooks가 비활성인 환경에서는 같은 규칙이 지침으로만 작동한다. 원격에서는 CI가 일부 검사를 보완한다.

## 5. 보호 경로

| 경로 | 정책 | 이유 |
| --- | --- | --- |
| `feature_list.json` | deny | PilotRails 상태의 단일 정본 |
| `.github/copilot-instructions.md` | ask | 항상 로드되는 전역 규칙 |
| `docs/05-decision-log.md` | ask | 설계 결정 기록 |
| `.github/hooks/` | ask(prefix) | 가드 스크립트 자체 보호 |

보호 경로 문자열은 [02-ghcp-harness-design.md](02-ghcp-harness-design.md)에 명시되어 있어야 `harness-doctor`가 통과한다.

## 6. 자기 진단

| 명령 | 확인 내용 |
| --- | --- |
| `node scripts/harness-doctor.mjs` | 보호 경로, 문서/구현 정합, 죽은 자산 |
| `node --test tests/*.test.mjs` | hook 순수 로직 단위 테스트 |
| `node scripts/smoke.mjs` | `sandbox/*` 검증 앱 테스트 |

자세한 실행 순서는 [08-run-harness.md](08-run-harness.md)를 본다.
