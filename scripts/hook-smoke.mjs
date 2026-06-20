#!/usr/bin/env node
// Agent hooks CLI smoke — 문서의 stdin JSON 직접 실행 경로를 한 번에 검증한다.
// VS Code Preview 자동 발화를 대체하지는 않지만, hooks payload 입출력 계약을
// 결정론적으로 확인해 실제 적용 전 기본 배선을 점검한다.

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const checks = [];

function pass(name) {
  checks.push(name);
  console.log("  ✓ " + name);
}

function runHook(script, event) {
  return execFileSync("node", [script], {
    input: JSON.stringify(event),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function parseJson(output, label) {
  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${label}: JSON 출력 파싱 실패`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkProtectPaths() {
  const output = runHook(".github/hooks/protect-paths.mjs", {
    tool_name: "create_file",
    tool_input: { filePath: "feature_list.json" },
  });
  const parsed = parseJson(output, "protect-paths");
  assert(parsed.hookSpecificOutput?.hookEventName === "PreToolUse", "protect-paths 이벤트명 불일치");
  assert(parsed.hookSpecificOutput?.permissionDecision === "deny", "protect-paths deny 불일치");
  pass("PreToolUse protect-paths deny");
}

function checkValidateDocs() {
  const dir = mkdtempSync(join(tmpdir(), "hook-smoke-"));
  const file = join(dir, "broken.md");
  try {
    writeFileSync(file, "[bad](./missing.md)\n");
    const output = runHook(".github/hooks/validate-docs.mjs", {
      tool_name: "create_file",
      tool_input: { filePath: file },
    });
    const parsed = parseJson(output, "validate-docs");
    assert(parsed.hookSpecificOutput?.hookEventName === "PostToolUse", "validate-docs 이벤트명 불일치");
    assert(/문서 포맷 경고/.test(parsed.hookSpecificOutput?.additionalContext || ""), "validate-docs 경고 누락");
    pass("PostToolUse validate-docs warning");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function checkSessionReady(eventName) {
  const output = runHook(".github/hooks/session-ready.mjs", { hook_event_name: eventName });
  const parsed = parseJson(output, "session-ready");
  assert(parsed.hookSpecificOutput?.hookEventName === eventName, `session-ready ${eventName} 이벤트명 불일치`);
  assert(/하네스 상태\(feature_list\.json\)/.test(parsed.hookSpecificOutput?.additionalContext || ""), `session-ready ${eventName} 상태 요약 누락`);
  pass(`${eventName} session-ready context`);
}

function checkVerifyDoneReentry() {
  const output = runHook(".github/hooks/verify-done.mjs", { stop_hook_active: true });
  assert(output === "", "verify-done 재진입은 출력 없이 통과해야 함");
  pass("Stop verify-done reentry pass");
}

function checkPrecompactHandoff() {
  const output = runHook(".github/hooks/precompact-handoff.mjs", {});
  const parsed = parseJson(output, "precompact-handoff");
  assert(parsed.hookSpecificOutput?.hookEventName === "PreCompact", "precompact 이벤트명 불일치");
  assert(/PreCompact handoff/.test(parsed.hookSpecificOutput?.additionalContext || ""), "precompact handoff 누락");
  pass("PreCompact precompact-handoff context");
}

try {
  checkProtectPaths();
  checkValidateDocs();
  checkSessionReady("SessionStart");
  checkSessionReady("UserPromptSubmit");
  checkVerifyDoneReentry();
  checkPrecompactHandoff();
  console.log(`\nOK — hook-smoke 통과 (${checks.length}개)`);
} catch (error) {
  console.error("\n실패: " + error.message);
  process.exit(1);
}