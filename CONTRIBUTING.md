# 기여 가이드 (Contributing)

PilotRails는 GitHub Copilot용 **정책 하네스**다. 기여는 "더 많은 기능"보다 **관찰된 마찰을 줄이는 최소 변경**을 지향한다(근거: [docs/06](docs/06-harness-operating-plan.md) — 관찰된 실패에서 PilotRails가 나온다).

## 시작하기

```bash
git clone https://github.com/YOONPYOGitHub/pilotrails.git
cd pilotrails
node scripts/harness-doctor.mjs   # 거버넌스 정합
node --test tests/*.test.mjs      # hook 단위 테스트
node scripts/smoke.mjs            # 샌드박스 앱 스모크(앱별 npm install 후)
```

전제: Node 18+, VS Code + GitHub Copilot Chat.

## 핵심 규칙

이 규칙들은 [.github/copilot-instructions.md](.github/copilot-instructions.md)의 불변 규칙과 일치한다.

1. **상태는 단일 경로로만.** `feature_list.json`의 `status`는 [/finish](.github/prompts/finish.prompt.md) 프롬프트로만 바꾼다. 직접 편집은 `PreToolUse` 가드가 차단한다.
2. **보호 경로 존중.** `feature_list.json`, `.github/copilot-instructions.md`, `docs/05-decision-log.md`, `.github/hooks/`는 보호 대상이다. 바꿔야 하면 PR 설명에 이유를 명시한다.
3. **검증이 곧 완료.** "컴파일된다"가 아니라 **(1) diff로 변경을 명확히 하고 (2) 관련 검사를 실제로 돌려 통과**해야 한다.
4. **새 장치는 관찰된 실패에만.** 추측성 기능은 [docs/07-deferred-backlog.md](docs/07-deferred-backlog.md)에 도입 트리거와 함께 기록하고 보류한다.

## 검증 (PR 전 필수)

아래가 모두 통과해야 한다. 출력을 PR 본문에 붙여 주세요.

```bash
node scripts/harness-doctor.mjs   # exit 0 + "OK"
node --test tests/*.test.mjs      # 전부 pass
node scripts/smoke.mjs            # 샌드박스 앱 통과(또는 건너뜀)
```

> 보호 경로를 새로 추가하면 그 경로 문자열이 [docs/02 §4](docs/02-ghcp-harness-design.md)에 명시돼 있어야 `harness-doctor`가 통과한다(문서↔훅 정합).

## 커밋·PR

- 커밋은 **검증 통과 마일스톤**에서만(green = 롤백 지점).
- 커밋 메시지: `<type>(<scope>): <요약>` (예: `docs(product): ...`, `feat(harness): ...`).
- PR은 [PULL_REQUEST_TEMPLATE](.github/PULL_REQUEST_TEMPLATE.md)의 체크리스트를 채운다(영향 범위·검증 증거·상태 정합).

## 비가역 작업

push·`--force`·`reset --hard`·파일/브랜치 삭제·인프라 변경은 **항상 사람 승인** 후 진행한다(위험 등급제).
