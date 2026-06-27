// ready 회귀 테스트 — 새 세션 시작용 단일 점검 명령의 핵심 출력을 검증한다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const READY_SCRIPT = fileURLToPath(new URL("../scripts/ready.mjs", import.meta.url));

test("ready는 하네스 상태와 다음 검증 명령을 요약한다", () => {
  const output = execFileSync("node", [READY_SCRIPT], { encoding: "utf8" });

  assert.match(output, /PilotRails ready check/);
  assert.match(output, /feature_list: done 20 · in-progress 0 · not-started 0/);
  assert.match(output, /node scripts\/harness-doctor\.mjs/);
  assert.match(output, /node --test tests\/\*\.test\.mjs/);
  assert.match(output, /node scripts\/ready\.mjs --full/);
});