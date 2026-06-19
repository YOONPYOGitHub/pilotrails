# PilotRails 구조와 거버넌스

이 문서는 PilotRails의 **현재 구조**를 설명한다. 목표는 새 런타임을 만드는 것이 아니라, VS Code Copilot이 인식하는 `.github/` 자산과 가벼운 Node 스크립트로 작업 흐름을 규율하는 것이다.

## 1. 구성 개요

```text
.github/
  agents/          # Plan, Build, Ask, Explore 모드
  instructions/    # 파일 종류별 지침
  skills/          # 온디맨드 절차
  hooks/           # 보호 경로, 문서 검사, 완료 게이트
  prompts/         # /finish 완료 경로
  workflows/       # CI, CodeQL
scripts/           # doctor, smoke
tests/             # hook 순수 로직 테스트
feature_list.json  # PilotRails 정책 자산 상태 정본
```

## 2. 작업 흐름

```text
사용자 요청
  -> Plan / Ask / Build 중 적절한 모드 선택
  -> 필요 시 Explore가 read-only 탐색
  -> Build가 단일 스레드로 편집
  -> 진단·테스트·doctor로 검증
  -> /finish로 상태 정합과 완료 처리
```

핵심은 **쓰기 책임을 분산하지 않는 것**이다. Explore는 넓은 탐색을 돕지만 코드를 작성하지 않는다. Build가 편집과 검증을 통합해 diff와 결과를 책임진다.

## 3. 상태 정본

[feature_list.json](../feature_list.json)은 PilotRails 정책 자산의 상태를 담는 단일 정본이다. `status` 변경은 [/finish](../.github/prompts/finish.prompt.md)를 통해서만 수행한다.

이 규칙은 상태 드리프트를 막기 위한 것이다. 문서나 대화에는 계획을 적을 수 있지만, 완료 상태는 하나의 파일과 하나의 경로로만 바꾼다.

## 4. 보호 경로

다음 경로는 직접 편집 시 hook이 deny/ask 정책을 적용한다.

| 경로 | 매칭 | 정책 | 이유 |
| --- | --- | --- | --- |
| `feature_list.json` | exact | deny | 상태 정본 직접 편집 방지 |
| `.github/copilot-instructions.md` | exact | ask | 항상 로드되는 전역 규칙 보호 |
| `docs/05-decision-log.md` | exact | ask | 설계 결정 근거 보호 |
| `.github/hooks/` | prefix | ask | 가드 스크립트 자체 보호 |

[scripts/harness-doctor.mjs](../scripts/harness-doctor.mjs)는 위 문자열이 이 문서에 명시되어 있는지 확인한다. 새 보호 경로를 추가하면 hook과 이 문서를 함께 바꿔야 한다.

## 5. 검증 루프

완료의 기준은 다음 세 가지다.

1. 변경 범위가 의도와 일치한다.
2. 관련 검증 명령을 실제로 실행했다.
3. 실패가 있으면 기존 실패와 신규 실패를 구분했다.

기본 검증 명령은 다음과 같다.

```bash
node scripts/harness-doctor.mjs
node --test tests/*.test.mjs
node scripts/smoke.mjs
```

## 6. CI와 로컬 hooks의 관계

로컬 Agent hooks는 Preview 기능이므로 모든 사용자 환경에서 활성이라고 가정하지 않는다. 그래서 CI가 원격에서 최소 검사를 반복한다.

| 계층 | 역할 |
| --- | --- |
| 로컬 hooks | 대화 중 즉시 경고·차단 |
| `harness-doctor` | 문서와 구현의 정합 검사 |
| GitHub Actions | push/PR에서 doctor, tests, smoke 실행 |
| CodeQL / Dependabot | 공개 OSS 보안 기본선 |

## 7. 확장 원칙

새 장치는 "좋아 보인다"는 이유만으로 추가하지 않는다. 실제 작업에서 반복 마찰이 관찰되면, 그 마찰만 겨냥해 최소한으로 추가한다. 보류 중인 확장은 [07-deferred-backlog.md](07-deferred-backlog.md)에 기록한다.
