// harness-doctor 회귀 테스트 — 임시 하네스 루트에서 문서/구현 드리프트를 검증한다.
// 실제 저장소 파일을 오염시키지 않고 `PILOTRAILS_ROOT`로 테스트 fixture를 주입한다.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOCTOR_SCRIPT = fileURLToPath(new URL("../scripts/harness-doctor.mjs", import.meta.url));

function write(root, path, text) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
}

const DEFAULT_PROTECTED = [
  { path: "feature_list.json", decision: "deny", reason: "state" },
  { path: ".github/copilot-instructions.md", decision: "ask", reason: "instructions" },
  { path: "docs/05-decision-log.md", decision: "ask", reason: "decisions" },
  { path: ".github/hooks/", match: "prefix", decision: "ask", reason: "hooks" },
];

function createMinimalHarnessRoot({ designText, protectedRules = DEFAULT_PROTECTED }) {
  const root = join(tmpdir(), `doctor-${process.pid}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(root, { recursive: true });

  write(root, "docs/02-ghcp-harness-design.md", designText);
  write(root, "docs/05-decision-log.md", "# decisions\n");
  write(root, ".github/copilot-instructions.md", "# instructions\n");
  write(root, ".github/hooks/protect-paths.mjs", `export const PROTECTED = ${JSON.stringify(protectedRules)};\n`);
  write(root, ".github/hooks/validate-docs.mjs", "// wired\n");
  write(root, ".github/hooks/verify-done.mjs", "// wired\n");
  write(root, ".github/agents/plan.agent.md", "---\nname: Plan\n---\n");
  write(root, "README.md", "plan.agent.md\nprotect-paths.mjs\n");
  write(
    root,
    ".github/hooks/hooks.json",
    JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: "apply_patch",
            hooks: [{ type: "command", command: "node .github/hooks/protect-paths.mjs" }],
          },
        ],
        PostToolUse: [
          {
            matcher: "apply_patch",
            hooks: [{ type: "command", command: "node .github/hooks/validate-docs.mjs" }],
          },
        ],
        Stop: [
          { hooks: [{ type: "command", command: "node .github/hooks/verify-done.mjs" }] },
        ],
      },
    }),
  );
  write(
    root,
    "feature_list.json",
    JSON.stringify({
      statuses: ["done"],
      features: [
        {
          id: "agent-plan",
          path: ".github/agents/plan.agent.md",
          status: "done",
          deps: [],
        },
      ],
    }),
  );

  return root;
}

function runDoctor(root) {
  try {
    return {
      status: 0,
      output: execFileSync("node", [DOCTOR_SCRIPT], {
        env: { ...process.env, PILOTRAILS_ROOT: root },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    };
  } catch (error) {
    return {
      status: error.status,
      output: `${error.stdout || ""}${error.stderr || ""}`,
    };
  }
}

test("harness-doctor는 보호 경로가 설계서에 빠지면 실패한다", () => {
  const root = createMinimalHarnessRoot({ designText: "# design\nfeature_list.json\n" });
  try {
    const result = runDoctor(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /보호 경로가 설계서\(docs\/02\)에 명시되지 않음/);
    assert.match(result.output, /\.github\/copilot-instructions\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("harness-doctor는 fixture의 protect-paths 규칙을 기준으로 검사한다", () => {
  const root = createMinimalHarnessRoot({
    designText:
      "# design\nfeature_list.json\n.github/copilot-instructions.md\ndocs/05-decision-log.md\n.github/hooks/\n",
    protectedRules: [
      ...DEFAULT_PROTECTED,
      { path: "custom/protected.md", decision: "ask", reason: "custom" },
    ],
  });
  try {
    write(root, "custom/protected.md", "# protected\n");
    const result = runDoctor(root);
    assert.equal(result.status, 1);
    assert.match(result.output, /custom\/protected\.md/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("harness-doctor는 최소 하네스 fixture가 정합하면 통과한다", () => {
  const root = createMinimalHarnessRoot({
    designText:
      "# design\nfeature_list.json\n.github/copilot-instructions.md\ndocs/05-decision-log.md\n.github/hooks/\n",
  });
  try {
    const result = runDoctor(root);
    assert.equal(result.status, 0);
    assert.match(result.output, /OK — harness-doctor 통과/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});