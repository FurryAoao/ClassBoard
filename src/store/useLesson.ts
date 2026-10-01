import { create } from "zustand";

export interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }

export interface EndedLesson { course: Course; startedAt: number | null; endedAt: number; }

interface LessonState {
  activeCourse: Course | null;
  startedAt: number | null;
  focusOn: boolean;
  lastLesson: EndedLesson | null;
  startClass: (c: Course) => void;
  endClass: () => void;
  dismissLast: () => void;
  setFocusOn: (on: boolean) => void;
}

interface Persisted { activeCourse: Course | null; startedAt: number | null; focusOn: boolean; lastLesson: EndedLesson | null; }
function load(): Persisted {
  const empty: Persisted = { activeCourse: null, startedAt: null, focusOn: false, lastLesson: null };
  try {
    const raw = localStorage.getItem("cb:lesson");
    if (!raw) return empty;
    const o = JSON.parse(raw);
    // 隔天自动清上课态与昨日下课记录（教师每天课不同）
    if (o && (o.startedAt || o.lastLesson)) {
      const ref = o.startedAt ?? o.lastLesson?.endedAt;
      if (ref && new Date(ref).toDateString() !== new Date().toDateString()) return empty;
    }
    return { activeCourse: o.activeCourse ?? null, startedAt: o.startedAt ?? null, focusOn: !!o.focusOn, lastLesson: o.lastLesson ?? null };
  } catch { return empty; }
}
function save(s: Persisted) {
  try { localStorage.setItem("cb:lesson", JSON.stringify(s)); } catch {}
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("lesson", JSON.stringify(s)));
}
const init = load();

export const useLesson = create<LessonState>((set, get) => ({
  activeCourse: init.activeCourse,
  startedAt: init.startedAt,
  focusOn: init.focusOn,
  lastLesson: init.lastLesson,
  startClass: (c) => {
    set({ activeCourse: c, startedAt: Date.now() });
    save({ activeCourse: c, startedAt: get().startedAt, focusOn: get().focusOn, lastLesson: get().lastLesson });
  },
  endClass: () => {
    const { activeCourse, startedAt } = get();
    const lastLesson = activeCourse ? { course: activeCourse, startedAt, endedAt: Date.now() } : get().lastLesson;
    set({ activeCourse: null, startedAt: null, focusOn: false, lastLesson });
    save({ activeCourse: null, startedAt: null, focusOn: false, lastLesson });
  },
  dismissLast: () => {
    set({ lastLesson: null });
    save({ activeCourse: get().activeCourse, startedAt: get().startedAt, focusOn: get().focusOn, lastLesson: null });
  },
  setFocusOn: (on) => {
    set({ focusOn: on });
    save({ activeCourse: get().activeCourse, startedAt: get().startedAt, focusOn: on, lastLesson: get().lastLesson });
  },
}));
