import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

describe("task CLI help", () => {
  it("손상된 TASK_DB가 있어도 도움말을 출력한다", () => {
    const dir = mkdtempSync(join(tmpdir(), "task-cli-"));
    const badDb = join(dir, "tasks.json");
    writeFileSync(badDb, "{bad json", "utf8");

    const out = execFileSync("node", ["--import", "tsx", "src/cli.ts", "help"], {
      cwd: process.cwd(),
      env: { ...process.env, TASK_DB: badDb },
      encoding: "utf8",
    });

    expect(out).toContain("사용법:");
  });
});