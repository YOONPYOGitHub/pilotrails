// Task 도메인 코어 — 순수 로직(파일 I/O 없음)으로 테스트 용이성 확보.
// 영속화는 persist.ts의 얇은 계층이 담당한다.

export type Filter = "all" | "active" | "done";

export interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export class TaskStore {
  #tasks: Task[];
  #nextId: number;

  constructor(initial: Task[] = []) {
    this.#tasks = initial.map((t) => ({ ...t }));
    this.#nextId =
      this.#tasks.reduce((max, t) => (t.id > max ? t.id : max), 0) + 1;
  }

  add(title: string): Task {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new Error("title은 비어 있을 수 없습니다");
    }
    const task: Task = {
      id: this.#nextId++,
      title: trimmed,
      done: false,
      createdAt: new Date().toISOString(),
    };
    this.#tasks.push(task);
    return { ...task };
  }

  list(filter: Filter = "all"): Task[] {
    const view =
      filter === "active"
        ? this.#tasks.filter((t) => !t.done)
        : filter === "done"
          ? this.#tasks.filter((t) => t.done)
          : this.#tasks;
    return view.map((t) => ({ ...t }));
  }

  complete(id: number): Task {
    const task = this.#find(id);
    task.done = true;
    return { ...task };
  }

  remove(id: number): Task {
    const idx = this.#tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`task ${id} not found`);
    const [removed] = this.#tasks.splice(idx, 1);
    return { ...(removed as Task) };
  }

  toJSON(): Task[] {
    return this.#tasks.map((t) => ({ ...t }));
  }

  static fromJSON(tasks: Task[]): TaskStore {
    return new TaskStore(tasks);
  }

  #find(id: number): Task {
    const task = this.#tasks.find((t) => t.id === id);
    if (!task) throw new Error(`task ${id} not found`);
    return task;
  }
}
