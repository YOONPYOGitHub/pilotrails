#!/usr/bin/env node
// 검증 앱 스모크 — 설계: docs/05 (2026-06-18 dogfood, 축 ⑤ 경량 센서)
// sandbox/ 하위 앱들의 테스트를 루트에서 한 번에 돌려, 앱 회귀를 단일 명령으로 감지한다.
// 풀 CI가 아니다. 다중 앱·반복 회귀가 관찰되면 그때 확장한다(과설계 방지).
//
// 통과 시 exit 0, 하나라도 실패하면 exit 1.
// node_modules가 없는 앱은 "건너뜀"으로 보고하고 실패 처리하지 않는다(로컬 미설치 허용).

import { readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SANDBOX = join(ROOT, "sandbox");

function findApps() {
  if (!existsSync(SANDBOX)) return [];
  return readdirSync(SANDBOX)
    .map((name) => join(SANDBOX, name))
    .filter((dir) => statSync(dir).isDirectory())
    .filter((dir) => existsSync(join(dir, "package.json")));
}

let failed = 0;
let ran = 0;
let skipped = 0;

for (const app of findApps()) {
  const name = app.slice(ROOT.length + 1);
  if (!existsSync(join(app, "node_modules"))) {
    console.log(`  ⤼ ${name} 건너뜀 (node_modules 없음 — 'npm install' 후 재실행)`);
    skipped++;
    continue;
  }
  process.stdout.write(`  • ${name} test … `);
  try {
    execFileSync("npm", ["test", "--silent"], { cwd: app, stdio: "pipe" });
    console.log("✓");
    ran++;
  } catch (err) {
    console.log("✗");
    const out = `${err.stdout || ""}${err.stderr || ""}`.trim();
    if (out) console.log(out.split("\n").slice(-15).map((l) => "      " + l).join("\n"));
    failed++;
  }
}

if (ran === 0 && skipped === 0) {
  console.log("스모크 대상 앱이 없습니다 (sandbox/*/package.json).");
}

if (failed > 0) {
  console.error(`\n스모크 실패: ${failed}개 앱`);
  process.exit(1);
}
console.log(`\nOK — 스모크 통과 (실행 ${ran}, 건너뜀 ${skipped})`);
