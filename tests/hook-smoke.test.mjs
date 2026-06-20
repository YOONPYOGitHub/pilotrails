// hook-smoke 회귀 테스트 — 문서의 hook 직접 실행 예시를 단일 명령으로 검증한다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HOOK_SMOKE_SCRIPT = fileURLToPath(new URL("../scripts/hook-smoke.mjs", import.meta.url));

test("hook-smoke는 주요 hook CLI payload 경로를 검증한다", () => {
  const output = execFileSync("node", [HOOK_SMOKE_SCRIPT], { encoding: "utf8" });
  assert.match(output, /PreToolUse protect-paths deny/);
  assert.match(output, /PostToolUse validate-docs warning/);
  assert.match(output, /SessionStart session-ready context/);
  assert.match(output, /UserPromptSubmit session-ready context/);
  assert.match(output, /Stop verify-done reentry pass/);
  assert.match(output, /PreCompact precompact-handoff context/);
  assert.match(output, /OK — hook-smoke 통과/);
});