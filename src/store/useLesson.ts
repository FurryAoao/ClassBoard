import { create } from "zustand";

export interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }

interface LessonState {
  activeCourse: Course | null;
  startedAt: number | null;
  focusOn: boolean;
  startClass: (c: Course) => void;
  endClass: () => void;
  setFocusOn: (on: boolean) => void;
}

function load(): { activeCourse: Course | null; startedAt: number | null; focusOn: boolean } {
  try {
    const raw = localStorage.getItem("cb:lesson");
    if (raw) {
      const o = JSON.parse(raw);
      // 隔天自动清上课态（教师每天课不同，不把昨天的课带到今天）
      if (o && o.startedAt) {
        const d1 = new Date(o.startedAt).toDateString();
        if (d1 !== new Date().toDateString()) return { activeCourse: null, startedAt: null, focusOn: false };
      }
      return { activeCourse: o.activeCourse ?? null, startedAt: o.startedAt ?? null, focusOn: !!o.focusOn };
    }
  } catch {}
  return { activeCourse: null, startedAt: null, focusOn: false };
}
function save(s: { activeCourse: Course | null; startedAt: number | null; focusOn: boolean }) {
  try { localStorage.setItem("cb:lesson", JSON.stringify(s)); } catch {}
  import("../lib/store-helpers").then(({ kvSet }) => kvSet("lesson", JSON.stringify(s)));
}
const init = load();

export const useLesson = create<LessonState>((set, get) => ({
  activeCourse: init.activeCourse,
  startedAt: init.startedAt,
  focusOn: init.focusOn,
  startClass: (c) => {
    const s = { activeCourse: c, startedAt: Date.now(), focusOn: get().focusOn };
    set({ activeCourse: c, startedAt: s.startedAt });
    save(s);
  },
  endClass: () => {
    const s = { activeCourse: null as Course | null, startedAt: null as number | null, focusOn: false as boolean };
    set({ activeCourse: null, startedAt: null, focusOn: false });
    save(s);
  },
  setFocusOn: (on) => {
    set({ focusOn: on });
    save({ activeCourse: get().activeCourse, startedAt: get().startedAt, focusOn: on });
  },
}));
