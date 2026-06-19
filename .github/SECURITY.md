# 보안 정책 (Security Policy)

PilotRails는 GitHub Copilot용 **정책 하네스**다. 실행 런타임이 아니라 `.github/` 커스터마이제이션·검사 스크립트·dogfood 샌드박스 앱으로 구성된다. 따라서 보안 표면은 주로 다음에 한정된다.

- `.github/hooks/*.mjs` 및 `scripts/*.mjs` — 로컬에서 `node`로 실행되는 거버넌스 스크립트
- `sandbox/*` — 검증용 예제 앱(외부 노출 의도 없음)
- CI 워크플로(`.github/workflows/`)

## 지원 범위

| 대상 | 지원 |
| --- | --- |
| `main` 브랜치 최신 | ✅ |
| 과거 태그/스냅샷 | ❌ (참고용) |

## 취약점 제보

공개 이슈로 올리지 말고 **비공개로** 제보해 주세요.

1. GitHub의 **Security advisories**(저장소 → Security → Report a vulnerability)를 우선 사용한다.
2. 불가 시 저장소 소유자에게 직접 연락한다.

제보 시 다음을 포함해 주세요.

- 영향받는 파일/스크립트와 재현 절차
- 예상 영향(예: 임의 명령 실행, 보호 경로 우회, CI 비밀 노출)
- 가능하면 PoC와 제안 패치

## 대응 기준

- 접수 확인: 영업일 기준 합리적 시일 내
- 수정 우선순위: 보호 경로 우회·CI 비밀 노출·임의 코드 실행을 최우선으로 다룬다.
- 수정은 검증 통과(`node scripts/harness-doctor.mjs`, `node --test tests/*.test.mjs`, `node scripts/smoke.mjs`) 후 머지한다.

## 범위 밖

- 샌드박스 앱의 가상 데이터(`*.json`)에 담긴 임의 입력
- VS Code/GitHub Copilot 자체 또는 Agent hooks Preview 기능의 취약점(해당 벤더에 제보)
