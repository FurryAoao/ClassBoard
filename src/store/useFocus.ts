import { create } from "zustand";

interface FocusState {
  mins: number;
  baseLeft: number;
  running: boolean;
  runningSince: number | null;
  done: number;
  day: string;
  setMins: (m: number) => void;
  start: () => void;
  stop: () => void;
  pause: () => void;
}

interface Persisted { mins: number; baseLeft: number; running: boolean; runningSince: number | null; done: number; day: string; }

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readOld(key: string): string | null {
  try { return localStorage.getItem("cb:" + key); } catch { return null; }
}

function load(): Persisted {
  const empty: Persisted = { mins: 25, baseLeft: 25 * 60, running: false, runningSince: null, done: 0, day: "" };
  try {
    const raw = localStorage.getItem("cb:focus");
    if (raw) {
      const o = JSON.parse(raw);
      const base: Persisted = {
        mins: typeof o.mins === "number" ? o.mins : empty.mins,
        baseLeft: typeof o.baseLeft === "number" ? o.baseLeft : (typeof o.mins === "number" ? o.mins * 60 : empty.baseLeft),
        running: !!o.running,
        runningSince: typeof o.runningSince === "number" ? o.runningSince : null,
        done: typeof o.done === "number" ? o.done : 0,
        day: typeof o.day === "string" ? o.day : "",
      };
      // 后台跑完恢复时直接结算，后面 settle 会加轮数；这里先冻结
      if (base.running && base.runningSince) {
        const elapsed = Math.floor((Date.now() - base.runningSince) / 1000);
        if (base.baseLeft - elapsed <= 0) {
          base.baseLeft = 0;
          base.running = false;
          base.runningSince = null;
        }
      }
      if (base.running && !base.runningSince) base.running = false;
      return base;
    }
    // 老版本迁移：focus:mins / focus:done / focus:day 是分散键
    const oldMins = readOld("focus:mins");
    const oldDone = readOld("focus:done");
    const oldDay = readOld("focus:day");
    if (oldMins !== null || oldDone !== null) {
      try {
        const m = oldMins !== null ? JSON.parse(oldMins) : 25;
        const d = oldDone !== null ? JSON.parse(oldDone) : 0;
        const dy = oldDay !== null ? JSON.parse(oldDay) : "";
        const mins = typeof m === "number" && m > 0 ? m : 25;
        return { mins, baseLeft: mins * 60, running: false, runningSince: null, done: typeof d === "number" ? d : 0, day: typeof dy === "string" ? dy : "" };
      } catch { /* fallthrough */ }
    }
    return empty;
  } catch { return empty; }
}

function save(s: Persisted) {
  try { localStorage.setItem("cb:focus", JSON.stringify(s)); } catch {}
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("focus", JSON.stringify(s)));
}

function syncLesson(on: boolean) {
  import("./useLesson").then(({ useLesson }) => {
    if (useLesson.getState().focusOn !== on) useLesson.getState().setFocusOn(on);
  });
}

/** 由时间戳推导当前剩余秒：切卡/收起后台照跑 */
export function displayLeft(s: Pick<FocusState, "baseLeft" | "running" | "runningSince">, now: number): number {
  if (!s.running || !s.runningSince) return s.baseLeft;
  return Math.max(0, s.baseLeft - Math.floor((now - s.runningSince) / 1000));
}

const init = load();
// 启动时与上课态对齐：运行中则胶囊显示“专注中”，否则清掉旧版残留的专注标记
syncLesson(init.running);

export const useFocus = create<FocusState>((set, get) => ({
  mins: init.mins,
  baseLeft: init.baseLeft,
  running: init.running,
  runningSince: init.runningSince,
  done: init.done,
  day: init.day,
  setMins: (mins) => {
    const st = get();
    const frozen = displayLeft(st, Date.now());
    // 未运行时顺手把剩余同步为新时长；运行中只记时长，下轮生效
    const next = st.running ? { mins } : { mins, baseLeft: mins * 60 };
    set(next);
    const n = get();
    save({ mins: n.mins, baseLeft: n.baseLeft, running: n.running, runningSince: n.runningSince, done: n.done, day: n.day });
    void frozen;
  },
  start: () => {
    const st = get();
    if (st.running) return;
    // 暂停后继续：从冻结的 baseLeft 接着跑；已归零则按当前时长重开
    const base = st.baseLeft > 0 ? st.baseLeft : st.mins * 60;
    set({ baseLeft: base, running: true, runningSince: Date.now() });
    const n = get();
    save({ mins: n.mins, baseLeft: n.baseLeft, running: n.running, runningSince: n.runningSince, done: n.done, day: n.day });
    syncLesson(true);
  },
  stop: () => {
    const st = get();
    if (!st.running) { syncLesson(false); return; }
    const frozen = displayLeft(st, Date.now());
    set({ baseLeft: frozen, running: false, runningSince: null });
    const n = get();
    save({ mins: n.mins, baseLeft: n.baseLeft, running: n.running, runningSince: n.runningSince, done: n.done, day: n.day });
    syncLesson(false);
  },
  pause: () => {
    // 关闭功能即暂停：保留进度，切回来继续
    get().stop();
  },
}));

/** 后台结算：专注在别处跑完时调用，记一轮并返回 true */
export function settleFocusIfExpired(now: number): boolean {
  const st = useFocus.getState();
  if (st.running && st.runningSince) {
    if (displayLeft(st, now) <= 0) {
      const t = todayStr();
      const done = st.day === t ? st.done + 1 : 1;
      useFocus.setState({ baseLeft: st.mins * 60, running: false, runningSince: null, done, day: t });
      const n = useFocus.getState();
      save({ mins: n.mins, baseLeft: n.baseLeft, running: n.running, runningSince: n.runningSince, done: n.done, day: n.day });
      syncLesson(false);
      return true;
    }
  }
  return false;
}
