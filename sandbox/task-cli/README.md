# task-cli

GHCP 하네스 **검증용 dogfood 앱**. 간단한 할 일(Task) 관리 CLI다. 이 앱의 목적은 기능 자체가 아니라, 하네스를 실제 구현 작업에 적용해 동작·마찰을 관찰하는 것이다([세션 저널](HARNESS-SESSION-LOG.md), [docs/06](../../docs/06-harness-operating-plan.md)).

## 구조

| 파일 | 역할 |
| --- | --- |
| [src/store.ts](src/store.ts) | Task 도메인 코어(순수 로직, I/O 없음) |
| [src/persist.ts](src/persist.ts) | JSON 파일 영속화 어댑터 |
| [src/cli.ts](src/cli.ts) | argv 파서·명령 디스패치 |
| [test/store.test.ts](test/store.test.ts) | vitest 단위 테스트 |
| [feature_list.json](feature_list.json) | 앱 자체 기능 레지스트리(하네스 상태패턴 dogfood) |

## 사용

```bash
npm install
npm test                       # vitest 단위 테스트

# CLI (데이터는 tasks.json, env TASK_DB로 변경 가능)
node --import tsx src/cli.ts add "우유 사기"
node --import tsx src/cli.ts list           # all|active|done
node --import tsx src/cli.ts done 1
node --import tsx src/cli.ts rm 1
```

## 검증 명령

- `npm test` — 단위 테스트(현재 8 passed).
