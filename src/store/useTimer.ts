import { create } from "zustand";

export type TimerMode = "up" | "down";

interface TimerState {
  mode: TimerMode;
  /** 暂停时的基准：倒计时=剩余秒，正计时=已累计秒 */
  baseSecs: number;
  running: boolean;
  runningSince: number | null;
  lesson: string | null;
  minsInput: string;
  setMode: (m: TimerMode) => void;
  setBaseSecs: (s: number) => void;
  setLesson: (l: string | null) => void;
  setMinsInput: (v: string) => void;
  startLesson: (label: string, mins: number) => void;
  start: () => void;
  pause: () => void;
  reset: (toSecs: number) => void;
  /** 时间到后点开始 = 按当前设定再来一次 */
  restart: () => void;
}

interface Persisted { mode: TimerMode; baseSecs: number; running: boolean; runningSince: number | null; lesson: string | null; minsInput: string; }

function load(): Persisted {
  const empty: Persisted = { mode: "down", baseSecs: 5 * 60, running: false, runningSince: null, lesson: null, minsInput: "5" };
  try {
    const raw = localStorage.getItem("cb:timer");
    if (!raw) return empty;
    const o = JSON.parse(raw);
    const base: Persisted = {
      mode: (o.mode === "up" ? "up" : "down") as TimerMode,
      baseSecs: typeof o.baseSecs === "number" ? o.baseSecs : empty.baseSecs,
      running: !!o.running,
      runningSince: typeof o.runningSince === "number" ? o.runningSince : null,
      lesson: typeof o.lesson === "string" ? o.lesson : null,
      minsInput: typeof o.minsInput === "string" ? o.minsInput : "5",
    };
    // 恢复时若倒计时已在后台跑完，直接结算为 0（不丢“时间到”状态）
    if (base.running && base.runningSince && base.mode === "down") {
      const elapsed = Math.floor((Date.now() - base.runningSince) / 1000);
      if (base.baseSecs - elapsed <= 0) {
        base.baseSecs = 0;
        base.running = false;
        base.runningSince = null;
      }
    }
    // 正计时运行中则保留，display 由时间戳推导，不丢秒数
    if (base.running && !base.runningSince) {
      base.running = false;
    }
    return base;
  } catch { return empty; }
}

function save(s: Persisted) {
  try { localStorage.setItem("cb:timer", JSON.stringify(s)); } catch {}
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("timer", JSON.stringify(s)));
}

/** 由时间戳推导当前显示秒数：切卡/收起/重启都不丢 */
export function displaySecs(s: Pick<TimerState, "mode" | "baseSecs" | "running" | "runningSince">, now: number): number {
  if (!s.running || !s.runningSince) return s.baseSecs;
  const elapsed = Math.floor((now - s.runningSince) / 1000);
  if (s.mode === "down") return Math.max(0, s.baseSecs - elapsed);
  return s.baseSecs + elapsed;
}

const init = load();

export const useTimer = create<TimerState>((set, get) => ({
  mode: init.mode,
  baseSecs: init.baseSecs,
  running: init.running,
  runningSince: init.runningSince,
  lesson: init.lesson,
  minsInput: init.minsInput,
  setMode: (mode) => {
    const st = get();
    // 切换模式先冻结当前进度，避免跳变
    const frozen = displaySecs(st, Date.now());
    set({ mode, baseSecs: frozen, running: false, runningSince: null, lesson: null });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  setBaseSecs: (baseSecs) => {
    set({ baseSecs, running: false, runningSince: null });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  setLesson: (lesson) => {
    set({ lesson });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  setMinsInput: (minsInput) => {
    set({ minsInput });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  startLesson: (label, mins) => {
    set({ lesson: label, mode: "down", baseSecs: mins * 60, minsInput: String(mins), running: true, runningSince: Date.now() });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  start: () => {
    const st = get();
    if (st.running) return;
    // 时间到后点开始 = 按当前设定再来一次
    if (st.mode === "down" && st.baseSecs <= 0) {
      const secs = Math.max(1, (Number(st.minsInput) || 5) * 60);
      set({ baseSecs: secs, running: true, runningSince: Date.now() });
    } else {
      set({ running: true, runningSince: Date.now() });
    }
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  pause: () => {
    const st = get();
    if (!st.running) return;
    const frozen = displaySecs(st, Date.now());
    set({ baseSecs: frozen, running: false, runningSince: null });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  reset: (toSecs) => {
    set({ running: false, runningSince: null, lesson: null, baseSecs: toSecs });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
  restart: () => {
    const st = get();
    const secs = Math.max(1, (Number(st.minsInput) || 5) * 60);
    set({ baseSecs: secs, running: true, runningSince: Date.now() });
    const n = get();
    save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
  },
}));

/** 后台结算：倒计时在别处跑完时调用，冻结为 0 并返回 true */
export function settleTimerIfExpired(now: number): boolean {
  const st = useTimer.getState();
  if (st.mode === "down" && st.running && st.runningSince) {
    const d = displaySecs(st, now);
    if (d <= 0) {
      useTimer.setState({ baseSecs: 0, running: false, runningSince: null });
      const n = useTimer.getState();
      save({ mode: n.mode, baseSecs: n.baseSecs, running: n.running, runningSince: n.runningSince, lesson: n.lesson, minsInput: n.minsInput });
      return true;
    }
  }
  return false;
}
