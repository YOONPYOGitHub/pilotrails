<!-- GHCP Harness PR 템플릿 -->

## 변경 요약

## 왜 필요한가
<!-- 관찰된 마찰/실패가 있으면 적어주세요. 추측성이면 docs/07에 보류 기록을 제안. -->

## 영향 범위
- [ ] agents
- [ ] hooks
- [ ] instructions
- [ ] skills
- [ ] prompts
- [ ] docs
- [ ] scripts
- [ ] sandbox apps
- [ ] 해당 없음

## 검증 증거
- [ ] `node scripts/harness-doctor.mjs`
- [ ] `node --test tests/`
- [ ] `node scripts/smoke.mjs`
- [ ] 수동 GHCP/VS Code 검증
- [ ] 해당 없음

출력 요약:

```text
(여기에 검증 명령 출력을 붙여주세요)
```

## 상태 정합
- [ ] `feature_list.json` 변경이 필요 없는 수정이다
- [ ] `feature_list.json`을 `/finish` 단일 경로로 갱신했다(직접 편집하지 않음)

## 보호 경로
- [ ] 보호 경로(`feature_list.json`, `.github/copilot-instructions.md`, `docs/05-decision-log.md`, `.github/hooks/`)를 건드리지 않았다
- [ ] 건드렸다면 이유를 위에 명시했고, 새 보호 경로는 `docs/02 §3.9`에 반영했다

## 문서/보안
- [ ] README 또는 관련 문서를 갱신했다
- [ ] 보안 영향이 있으면 SECURITY 관점 코멘트를 남겼다
