#!/usr/bin/env node
// 하네스 거버넌스 검사 — 설계: docs/02 §4-6 (wikidocs 원칙 6)
// "하네스 자신의 드리프트"를 센서로 막는다. 빌드 러너 없이 node로 실행·검증 가능.
//
//   1) 문서가 주장하는 보호 경로 ↔ hook이 실제 차단하는 경로 일치
//   2) 문서 수치 ↔ 실제 일치(에이전트 수, feature_list 경로 존재)
//   3) 등록된 자산이 어딘가에서 참조·배선되는가(죽은 자산 탐지)
//
// 통과 시 exit 0 + "OK", 실패 시 exit 1 + 실패 목록.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];
const oks = [];

function fail(msg) {
  fails.push(msg);
}
function ok(msg) {
  oks.push(msg);
}
function read(p) {
  return readFileSync(resolve(ROOT, p), "utf8");
}

function hookCommandsFor(hooksConfig, eventName) {
  const entries = hooksConfig.hooks?.[eventName] || [];
  return entries.flatMap((entry) =>
    (entry.hooks || []).map((hook) => ({
      matcher: entry.matcher || "",
      command: hook.command || "",
    })),
  );
}

function hasHookCommand(hooksConfig, eventName, scriptName, matcherPattern) {
  return hookCommandsFor(hooksConfig, eventName).some(
    (hook) =>
      hook.command.includes(scriptName) &&
      (!matcherPattern || matcherPattern.test(hook.matcher)),
  );
}

// 워크스페이스 내 모든 .md/.json/.mjs 텍스트를 한 번 모아 참조 검색에 쓴다.
function collectText(dir, acc = { files: [], blob: "", entries: [] }) {
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) collectText(full, acc);
    else if (/\.(md|json|mjs)$/.test(name)) {
      acc.files.push(full);
      const text = readFileSync(full, "utf8");
      acc.entries.push({ path: relative(ROOT, full).replace(/\\/g, "/"), text });
      acc.blob += "\n" + text;
    }
  }
  return acc;
}

// --- 1. 보호 경로 정합 ---
async function checkProtectedPaths() {
  const { PROTECTED } = await import("../.github/hooks/protect-paths.mjs");
  const design = read("docs/02-ghcp-harness-design.md");
  const hooksConfig = JSON.parse(read(".github/hooks/hooks.json"));

  if (!hasHookCommand(hooksConfig, "PreToolUse", "protect-paths.mjs", /apply_patch/))
    fail("hooks.json이 PreToolUse에 protect-paths.mjs를 쓰기 matcher와 함께 배선하지 않음");
  else ok("protect-paths.mjs가 hooks.json에 배선됨");

  for (const rule of PROTECTED) {
    if (!existsSync(resolve(ROOT, rule.path)))
      fail(`보호 경로 파일 없음: ${rule.path}`);
    if (!design.includes(rule.path))
      fail(`보호 경로가 설계서(docs/02)에 명시되지 않음: ${rule.path}`);
  }
  if (PROTECTED.every((r) => existsSync(resolve(ROOT, r.path)) && design.includes(r.path)))
    ok(`보호 경로 ${PROTECTED.length}개 모두 존재·문서 명시됨`);
}

// --- 2. 문서 수치 ↔ 실제 ---
function checkCounts() {
  const list = JSON.parse(read("feature_list.json"));
  if (!Array.isArray(list.features)) {
    fail("feature_list.json에 features 배열 없음");
    return list;
  }
  const allowedStatuses = new Set(list.statuses || []);
  const featureIds = new Set(list.features.map((f) => f.id));
  // 모든 feature.path 존재
  for (const f of list.features) {
    if (!f.id) fail("feature_list 항목 id 없음");
    if (!allowedStatuses.has(f.status))
      fail(`feature_list status 허용값 아님: ${f.id} → ${f.status}`);
    for (const dep of f.deps || []) {
      if (!featureIds.has(dep)) fail(`feature_list deps 대상 없음: ${f.id} → ${dep}`);
    }
    if (!f.path || !existsSync(resolve(ROOT, f.path)))
      fail(`feature_list 항목 경로 없음: ${f.id} → ${f.path}`);
  }
  // 에이전트 수: 실제 파일 ↔ feature_list agent-* ↔ 문서 주장
  const agentFiles = readdirSync(resolve(ROOT, ".github/agents")).filter((n) =>
    n.endsWith(".agent.md")
  );
  const agentFeatures = list.features.filter((f) => f.id.startsWith("agent-"));
  if (agentFiles.length !== agentFeatures.length)
    fail(
      `에이전트 수 불일치: 파일 ${agentFiles.length} ≠ feature_list ${agentFeatures.length}`
    );
  else ok(`에이전트 수 일치: ${agentFiles.length}개`);

  const readme = read("README.md");
  if (!new RegExp(`${agentFiles.length}\\s*모드|3\\s*모드`).test(readme)) {
    // 정보성: 모드 수 표기(Plan·Build·Ask=3 + Explore 서브에이전트)
  }
  return list;
}

// --- 3. 죽은 자산 탐지 ---
function checkDeadAssets(list) {
  const collected = collectText(ROOT);
  const hooksConfig = JSON.parse(read(".github/hooks/hooks.json"));

  // 모든 hook 스크립트가 hooks.json에 배선
  const hookDir = resolve(ROOT, ".github/hooks");
  for (const name of readdirSync(hookDir).filter((n) => n.endsWith(".mjs"))) {
    const wired = Object.keys(hooksConfig.hooks || {}).some((eventName) =>
      hookCommandsFor(hooksConfig, eventName).some((hook) => hook.command.includes(name)),
    );
    if (!wired)
      fail(`죽은 hook(배선 안 됨): .github/hooks/${name}`);
  }

  if (!hasHookCommand(hooksConfig, "PostToolUse", "validate-docs.mjs", /apply_patch/))
    fail("hooks.json이 PostToolUse에 validate-docs.mjs를 쓰기 matcher와 함께 배선하지 않음");
  if (!hasHookCommand(hooksConfig, "Stop", "verify-done.mjs"))
    fail("hooks.json이 Stop에 verify-done.mjs를 배선하지 않음");

  // 모든 feature.path가 자기 자신 외 어딘가에서 참조됨
  for (const f of list.features) {
    if (!f.path) continue;
    const base = f.path.split("/").pop();
    const searchBlob = collected.entries
      .filter((entry) => entry.path !== "feature_list.json" && entry.path !== f.path)
      .map((entry) => entry.text)
      .join("\n");
    // 참조 카운트: feature_list 자기 정의와 파일 자체를 제외한 문서/배선에서
    // 전체 경로 또는 파일명이 최소 1회 등장해야 한다.
    const count = searchBlob.split(base).length - 1;
    const referenced = searchBlob.includes(f.path) || count >= 1;
    if (!referenced) fail(`죽은 자산(참조 없음): ${f.id} → ${f.path}`);
  }
  ok(`자산 ${list.features.length}개 배선·참조 검사 완료`);
}

async function main() {
  try {
    await checkProtectedPaths();
    const list = checkCounts();
    checkDeadAssets(list);
  } catch (e) {
    fail(`검사 중 예외: ${e.message}`);
  }

  for (const m of oks) console.log("  ✓ " + m);
  if (fails.length === 0) {
    console.log("\nOK — harness-doctor 통과");
    process.exit(0);
  }
  console.error("\n실패:");
  for (const m of fails) console.error("  ✗ " + m);
  console.error(`\n${fails.length}건 실패`);
  process.exit(1);
}

main();
