// 영속화 계층 — store(순수)와 파일시스템을 잇는 얇은 어댑터.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { TaskStore, type Task } from "./store.ts";

export function loadStore(path: string): TaskStore {
  if (!existsSync(path)) return new TaskStore();
  try {
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw) as Task[];
    if (!Array.isArray(data)) throw new Error("데이터 형식 오류: 배열 아님");
    return TaskStore.fromJSON(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`${path} 로드 실패: ${msg}`);
  }
}

export function saveStore(path: string, store: TaskStore): void {
  writeFileSync(path, JSON.stringify(store.toJSON(), null, 2) + "\n", "utf8");
}
