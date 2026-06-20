// hook 순수 로직 단위 테스트 — 설계: docs/02 §4-5, docs/04 G.
// 가드의 핵심 결정 로직(보호 경로 평가·문서 링크 검사)을 결정론적으로 검증한다.
// 의존성 없이 `node --test tests/*.test.mjs`로 실행(이 레포는 빌드 러너가 없는 문서 레포).
// git 상태에 의존하는 함수는 임시 git repo fixture로 격리해 검증한다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, rmSync, mkdtempSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { evaluate, extractPaths } from "../.github/hooks/protect-paths.mjs";
import { buildHandoff, changedFiles } from "../.github/hooks/precompact-handoff.mjs";
import { summarize } from "../.github/hooks/session-ready.mjs";
import { checkMarkdown, extractMarkdownPaths } from "../.github/hooks/validate-docs.mjs";
import {
  harnessAssetsChanged,
  uncommittedStatusChange,
} from "../.github/hooks/verify-done.mjs";

const PRECOMPACT_SCRIPT = fileURLToPath(new URL("../.github/hooks/precompact-handoff.mjs", import.meta.url));
const PROTECT_PATHS_SCRIPT = fileURLToPath(new URL("../.github/hooks/protect-paths.mjs", import.meta.url));
const SESSION_READY_SCRIPT = fileURLToPath(new URL("../.github/hooks/session-ready.mjs", import.meta.url));
const VALIDATE_DOCS_SCRIPT = fileURLToPath(new URL("../.github/hooks/validate-docs.mjs", import.meta.url));
const VERIFY_DONE_SCRIPT = fileURLToPath(new URL("../.github/hooks/verify-done.mjs", import.meta.url));

function createGitRepo(files) {
  const dir = mkdtempSync(join(tmpdir(), "hook-git-"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  execFileSync("git", ["add", "."], { cwd: dir });
  execFileSync(
    "git",
    ["-c", "user.email=test@example.invalid", "-c", "user.name=Test", "commit", "-qm", "baseline"],
    { cwd: dir },
  );
  return dir;
}

function withCwd(dir, fn) {
  const previous = process.cwd();
  try {
    process.chdir(dir);
    return fn();
  } finally {
    process.chdir(previous);
  }
}

function runHookScript(script, event, options = {}) {
  return execFileSync("node", [script], {
    cwd: options.cwd,
    input: JSON.stringify(event),
    encoding: "utf8",
  });
}

// --- protect-paths: 보호 경로 평가 ---

test("정규 상태 소스(feature_list.json)는 deny", () => {
  const paths = extractPaths({ filePath: "feature_list.json" });
  assert.deepEqual(paths, ["feature_list.json"]);
  assert.equal(evaluate(paths)?.decision, "deny");
});

test("하위 앱의 동명 feature_list.json은 미보호(과차단 회피)", () => {
  const paths = extractPaths({ filePath: "sandbox/task-cli/feature_list.json" });
  assert.equal(evaluate(paths), null);
});

test("단일 always-on 규칙은 ask", () => {
  const rule = evaluate(extractPaths({ filePath: ".github/copilot-instructions.md" }));
  assert.equal(rule?.decision, "ask");
});

test("hooks 디렉터리 전체는 prefix ask 보호", () => {
  for (const f of [".github/hooks/protect-paths.mjs", ".github/hooks/verify-done.mjs"]) {
    assert.equal(evaluate(extractPaths({ filePath: f }))?.decision, "ask", f);
  }
});

test("hooks 디렉터리 밖의 동명 접두는 미보호", () => {
  assert.equal(evaluate(extractPaths({ filePath: ".github/hooks-notes.md" })), null);
});

test("비보호 경로는 null", () => {
  assert.equal(evaluate(extractPaths({ filePath: "README.md" })), null);
});

test("다중 경로에서 deny가 ask보다 강함", () => {
  const rule = evaluate(["feature_list.json", ".github/copilot-instructions.md"]);
  assert.equal(rule?.decision, "deny");
});

test("apply_patch 패치 본문에서 보호 경로를 추출한다", () => {
  const paths = extractPaths({
    patch: "*** Begin Patch\n*** Update File: feature_list.json\n@@\n*** End Patch",
  });
  assert.deepEqual(paths, ["feature_list.json"]);
  assert.equal(evaluate(paths)?.decision, "deny");
});

// --- validate-docs: 깨진 상대 링크 검사 ---

test("깨진 상대 링크를 감지한다", () => {
  const dir = mkdtempSync(join(tmpdir(), "vd-"));
  try {
    const f = join(dir, "x.md");
    writeFileSync(join(dir, "real.md"), "hi\n");
    writeFileSync(f, "[ok](./real.md) and [bad](./nope-xyz.md)\n");
    const warns = checkMarkdown(f);
    assert.equal(warns.length, 1);
    assert.match(warns[0], /nope-xyz\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("외부·앵커 링크는 무시한다", () => {
  const dir = mkdtempSync(join(tmpdir(), "vd-"));
  try {
    const f = join(dir, "y.md");
    writeFileSync(f, "[h](https://example.com) [a](#sec) [m](mailto:x@y.z)\n");
    assert.equal(checkMarkdown(f).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("MultiEdit replacements에서 수정된 마크다운 파일을 추출한다", () => {
  const paths = extractMarkdownPaths({
    replacements: [
      { filePath: "README.md" },
      { file_path: "docs/00-harness-features.md" },
      { filePath: "scripts/harness-doctor.mjs" },
    ],
  });
  assert.deepEqual(paths, ["README.md", "docs/00-harness-features.md"]);
});

// --- verify-done: git 상태 기반 Stop hook 판단 ---

test("feature_list.json 미커밋 변경을 감지한다", () => {
  const dir = createGitRepo({ "feature_list.json": "{}\n" });
  try {
    withCwd(dir, () => {
      assert.equal(uncommittedStatusChange(), false);
      writeFileSync(join(dir, "feature_list.json"), "{\"changed\":true}\n");
      assert.equal(uncommittedStatusChange(), true);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("하네스 자산 미커밋 변경을 감지한다", () => {
  const dir = createGitRepo({
    "feature_list.json": "{}\n",
    "README.md": "# baseline\n",
  });
  try {
    withCwd(dir, () => {
      assert.equal(harnessAssetsChanged(), false);
      writeFileSync(join(dir, "README.md"), "# changed\n");
      assert.equal(harnessAssetsChanged(), true);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("stop_hook_active 재진입은 차단하지 않는다", () => {
  const out = execFileSync("node", [VERIFY_DONE_SCRIPT], {
    input: JSON.stringify({ stop_hook_active: true }),
    encoding: "utf8",
  });
  assert.equal(out, "");
});

test("verify-done CLI는 feature_list.json 미커밋 변경을 block으로 출력한다", () => {
  const dir = createGitRepo({
    "feature_list.json": "{}\n",
    "scripts/harness-doctor.mjs": "process.exit(0);\n",
  });
  try {
    writeFileSync(join(dir, "feature_list.json"), "{\"changed\":true}\n");
    const out = runHookScript(VERIFY_DONE_SCRIPT, {}, { cwd: dir });
    const parsed = JSON.parse(out);
    assert.equal(parsed.decision, "block");
    assert.match(parsed.reason, /feature_list\.json에 미커밋 변경/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verify-done CLI는 harness-doctor 실패를 block으로 출력한다", () => {
  const dir = createGitRepo({
    "README.md": "# baseline\n",
    "scripts/harness-doctor.mjs": "console.error('doctor failed'); process.exit(1);\n",
  });
  try {
    writeFileSync(join(dir, "README.md"), "# changed\n");
    const out = runHookScript(VERIFY_DONE_SCRIPT, {}, { cwd: dir });
    const parsed = JSON.parse(out);
    assert.equal(parsed.decision, "block");
    assert.match(parsed.reason, /harness-doctor가 거버넌스 드리프트/);
    assert.match(parsed.reason, /doctor failed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- session-ready: 상태 요약 주입 ---

test("feature_list 상태 수와 다음 후보를 요약한다", () => {
  const dir = mkdtempSync(join(tmpdir(), "hook-session-"));
  try {
    writeFileSync(
      join(dir, "feature_list.json"),
      JSON.stringify({
        features: [
          { id: "done-a", status: "done" },
          { id: "active-a", status: "in-progress" },
          { id: "todo-a", status: "not-started" },
          { id: "todo-b", status: "not-started" },
        ],
      }),
    );
    const text = withCwd(dir, () => summarize());
    assert.match(text, /done 1 · in-progress 1 · not-started 2/);
    assert.match(text, /진행 중: active-a/);
    assert.match(text, /다음 후보: todo-a, todo-b/);
    assert.match(text, /상태 변경은 \/finish 단일 경로로만/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("feature_list를 읽을 수 없으면 상태 요약은 null", () => {
  const dir = mkdtempSync(join(tmpdir(), "hook-session-"));
  try {
    assert.equal(withCwd(dir, () => summarize()), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- precompact-handoff: 압축 전 변경 파일 안내 ---

test("PreCompact handoff에 미커밋 파일 목록을 포함한다", () => {
  const dir = createGitRepo({ "README.md": "# baseline\n" });
  try {
    withCwd(dir, () => {
      writeFileSync(join(dir, "README.md"), "# changed\n");
      writeFileSync(join(dir, "scratch.md"), "scratch\n");
      assert.deepEqual(changedFiles().sort(), ["README.md", "scratch.md"]);
      const handoff = buildHandoff();
      assert.match(handoff, /PreCompact handoff/);
      assert.match(handoff, /미커밋 변경 파일:/);
      assert.match(handoff, / - README\.md/);
      assert.match(handoff, / - scratch\.md/);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("git 상태를 읽을 수 없으면 변경 파일 목록은 비어 있다", () => {
  const dir = mkdtempSync(join(tmpdir(), "hook-precompact-"));
  try {
    assert.deepEqual(withCwd(dir, () => changedFiles()), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- hook CLI payload: stdin JSON -> stdout JSON ---

test("protect-paths CLI는 보호 경로 직접 편집을 deny로 출력한다", () => {
  const out = runHookScript(PROTECT_PATHS_SCRIPT, {
    tool_name: "create_file",
    tool_input: { filePath: "feature_list.json" },
  });
  const parsed = JSON.parse(out);
  assert.equal(parsed.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(parsed.hookSpecificOutput.permissionDecision, "deny");
  assert.match(parsed.hookSpecificOutput.permissionDecisionReason, /정규 상태 소스/);
});

test("validate-docs CLI는 깨진 상대 링크를 비차단 경고로 출력한다", () => {
  const dir = mkdtempSync(join(tmpdir(), "hook-docs-"));
  try {
    const filePath = join(dir, "broken.md");
    writeFileSync(filePath, "[bad](./missing.md)\n");
    const out = runHookScript(VALIDATE_DOCS_SCRIPT, {
      tool_name: "create_file",
      tool_input: { filePath },
    });
    const parsed = JSON.parse(out);
    assert.equal(parsed.hookSpecificOutput.hookEventName, "PostToolUse");
    assert.match(parsed.hookSpecificOutput.additionalContext, /문서 포맷 경고/);
    assert.match(parsed.hookSpecificOutput.additionalContext, /missing\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("session-ready CLI는 요청된 hook 이벤트 이름으로 상태 요약을 출력한다", () => {
  const dir = mkdtempSync(join(tmpdir(), "hook-session-"));
  try {
    writeFileSync(
      join(dir, "feature_list.json"),
      JSON.stringify({ features: [{ id: "done-a", status: "done" }] }),
    );
    const out = runHookScript(
      SESSION_READY_SCRIPT,
      { hook_event_name: "UserPromptSubmit" },
      { cwd: dir },
    );
    const parsed = JSON.parse(out);
    assert.equal(parsed.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    assert.match(parsed.hookSpecificOutput.additionalContext, /done 1 · in-progress 0 · not-started 0/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("precompact-handoff CLI는 handoff additionalContext를 출력한다", () => {
  const dir = createGitRepo({ "README.md": "# baseline\n" });
  try {
    writeFileSync(join(dir, "README.md"), "# changed\n");
    const out = runHookScript(PRECOMPACT_SCRIPT, {}, { cwd: dir });
    const parsed = JSON.parse(out);
    assert.equal(parsed.hookSpecificOutput.hookEventName, "PreCompact");
    assert.match(parsed.hookSpecificOutput.additionalContext, /PreCompact handoff/);
    assert.match(parsed.hookSpecificOutput.additionalContext, /README\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
