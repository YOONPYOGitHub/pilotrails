import { describe, it, expect } from "vitest";
import { TaskStore } from "../src/store.ts";

describe("TaskStore.add", () => {
  it("증가하는 id를 부여하고 title을 트림한다", () => {
    const store = new TaskStore();
    const a = store.add("  첫 작업  ");
    const b = store.add("둘째");
    expect(a.id).toBe(1);
    expect(a.title).toBe("첫 작업");
    expect(a.done).toBe(false);
    expect(b.id).toBe(2);
  });

  it("빈 title은 거부한다", () => {
    const store = new TaskStore();
    expect(() => store.add("   ")).toThrow(/title/i);
  });
});

describe("TaskStore.list", () => {
  it("필터로 active/done/all을 구분한다", () => {
    const store = new TaskStore();
    store.add("a");
    store.add("b");
    store.complete(1);
    expect(store.list("all")).toHaveLength(2);
    expect(store.list("active").map((t) => t.id)).toEqual([2]);
    expect(store.list("done").map((t) => t.id)).toEqual([1]);
  });
});

describe("TaskStore.complete", () => {
  it("done 플래그를 세운다", () => {
    const store = new TaskStore();
    store.add("a");
    const t = store.complete(1);
    expect(t.done).toBe(true);
  });

  it("없는 id는 에러", () => {
    const store = new TaskStore();
    expect(() => store.complete(99)).toThrow(/not found|99/i);
  });
});

describe("TaskStore.remove", () => {
  it("항목을 제거한다", () => {
    const store = new TaskStore();
    store.add("a");
    store.add("b");
    store.remove(1);
    expect(store.list("all").map((t) => t.id)).toEqual([2]);
  });

  it("없는 id는 에러", () => {
    const store = new TaskStore();
    expect(() => store.remove(1)).toThrow(/not found|1/i);
  });
});

describe("직렬화 라운드트립", () => {
  it("toJSON -> fromJSON으로 상태가 보존된다", () => {
    const store = new TaskStore();
    store.add("a");
    store.add("b");
    store.complete(2);
    const restored = TaskStore.fromJSON(store.toJSON());
    expect(restored.list("all")).toEqual(store.list("all"));
    // 복원 후 add는 max id+1을 이어간다
    expect(restored.add("c").id).toBe(3);
  });
});
