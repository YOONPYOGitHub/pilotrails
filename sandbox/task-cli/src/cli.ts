#!/usr/bin/env -S node --import tsx
// Task CLI — add/list/done/rm. 데이터는 tasks.json(작업 디렉터리)에 영속화.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadStore, saveStore } from "./persist.ts";
import type { Filter, Task } from "./store.ts";

const DATA_PATH = resolve(process.env.TASK_DB ?? "tasks.json");

function render(task: Task): string {
  return `${task.done ? "[x]" : "[ ]"} #${task.id} ${task.title}`;
}

function usage(): string {
  return [
    "task — 간단한 할 일 CLI",
    "",
    "사용법:",
    "  task add <title>     새 작업 추가",
    "  task list [filter]   목록 출력 (filter: all|active|done, 기본 all)",
    "  task done <id>       완료 표시",
    "  task rm <id>         삭제",
    "",
    `데이터 파일: ${DATA_PATH} (env TASK_DB로 변경 가능)`,
  ].join("\n");
}

function parseId(raw: string | undefined): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`유효한 id가 아닙니다: ${raw ?? "(없음)"}`);
  }
  return id;
}

export function run(argv: string[]): { code: number; out: string } {
  const [cmd, ...rest] = argv;
  const store = loadStore(DATA_PATH);

  switch (cmd) {
    case "add": {
      const title = rest.join(" ");
      const task = store.add(title);
      saveStore(DATA_PATH, store);
      return { code: 0, out: `추가됨: ${render(task)}` };
    }
    case "list": {
      const filter = (rest[0] ?? "all") as Filter;
      if (!["all", "active", "done"].includes(filter)) {
        return { code: 1, out: `알 수 없는 filter: ${filter}` };
      }
      const tasks = store.list(filter);
      if (tasks.length === 0) return { code: 0, out: "(비어 있음)" };
      return { code: 0, out: tasks.map(render).join("\n") };
    }
    case "done": {
      const task = store.complete(parseId(rest[0]));
      saveStore(DATA_PATH, store);
      return { code: 0, out: `완료: ${render(task)}` };
    }
    case "rm": {
      const task = store.remove(parseId(rest[0]));
      saveStore(DATA_PATH, store);
      return { code: 0, out: `삭제됨: ${render(task)}` };
    }
    case undefined:
    case "help":
    case "--help":
    case "-h":
      return { code: 0, out: usage() };
    default:
      return { code: 1, out: `알 수 없는 명령: ${cmd}\n\n${usage()}` };
  }
}

function main(): void {
  try {
    const { code, out } = run(process.argv.slice(2));
    process.stdout.write(out + "\n");
    process.exit(code);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`오류: ${msg}\n`);
    process.exit(1);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
