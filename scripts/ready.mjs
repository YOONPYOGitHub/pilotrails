#!/usr/bin/env node
// 세션 시작 점검 — PilotRails를 작업하기 전 현재 상태와 검증 경로를 한 번에 보여준다.
// 기본 실행은 빠른 요약만 출력한다. `--full`은 전체 하네스 검증을 실제로 실행한다.

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function testFiles() {
  return readdirSync(join(ROOT, "tests"))
    .filter((name) => name.endsWith(".test.mjs"))
    .sort()
    .map((name) => `tests/${name}`);
}

function fullCommands() {
  return [
    ["node", ["scripts/harness-doctor.mjs"]],
    ["node", ["--test", ...testFiles()]],
    ["node", ["scripts/hook-smoke.mjs"]],
    ["node", ["scripts/smoke.mjs"]],
  ];
}

function run(command, args) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryRun(command, args) {
  try {
    return run(command, args);
  } catch (error) {
    const output = `${error.stdout || ""}${error.stderr || ""}`.trim();
    return output || `failed: ${command} ${args.join(" ")}`;
  }
}

function featureSummary() {
  const list = JSON.parse(readFileSync(join(ROOT, "feature_list.json"), "utf8"));
  const counts = new Map((list.statuses || []).map((status) => [status, 0]));
  for (const feature of list.features || []) {
    counts.set(feature.status, (counts.get(feature.status) || 0) + 1);
  }
  return `done ${counts.get("done") || 0} · in-progress ${counts.get("in-progress") || 0} · not-started ${counts.get("not-started") || 0}`;
}

function printSummary() {
  const branch = tryRun("git", ["status", "-sb"]).split("\n")[0] || "git status unavailable";
  const dirtyCount = tryRun("git", ["status", "--porcelain"])
    .split("\n")
    .filter(Boolean).length;

  console.log("PilotRails ready check");
  console.log(`root: ${ROOT}`);
  console.log(`git: ${branch}${dirtyCount > 0 ? ` (${dirtyCount} changed)` : " (clean)"}`);
  console.log(`feature_list: ${featureSummary()}`);
  console.log("");
  console.log("Recommended verification:");
  console.log("  node scripts/harness-doctor.mjs");
  console.log("  node --test tests/*.test.mjs");
  console.log("  node scripts/hook-smoke.mjs");
  console.log("  node scripts/smoke.mjs");
  console.log("");
  console.log("Run full verification:");
  console.log("  node scripts/ready.mjs --full");
}

function runFull() {
  for (const [command, args] of fullCommands()) {
    console.log(`\n$ ${command} ${args.join(" ")}`);
    execFileSync(command, args, { cwd: ROOT, stdio: "inherit" });
  }
  console.log("\nOK — ready full verification 통과");
}

printSummary();

if (process.argv.includes("--full")) {
  runFull();
}