import { useEffect, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { useSettings } from "../store/useSettings";
import { weekZh } from "../lib/utils";
import { UiIcon } from "./icons";
import { useLesson } from "../store/useLesson";

interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }
interface Todo { id: string; text: string; done: boolean; }

/** 收起态胶囊：默认只显示时间；若课程表/待办已开启，则轮显当前课程与待办余量 */
export default function Capsule() {
  const now = useNow(true);
  const { enabled } = useSettings();
  const { activeCourse, focusOn } = useLesson();
  const [courses] = usePersistentState<Course[]>("schedule:list", []);
  const [todos] = usePersistentState<Todo[]>("todos:list", []);
  const [tick, setTick] = useState(0);

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  const t = `${hh}:${mm}`;
  const d = (now.getDay() + 6) % 7;
  const current = enabled.schedule
    ? courses.find((c) => c.day === d && c.start <= t && t <= c.end) ?? null
    : null;
  const next = enabled.schedule
    ? courses.filter((c) => c.day === d && c.start > t).sort((a, b) => a.start.localeCompare(b.start))[0] ?? null
    : null;
  const left = enabled.todos ? todos.filter((x) => !x.done).length : 0;

  const pages: string[] = [`${weekZh(now.getDay())} · 悬停展开`];
  if (current) pages.unshift(`正在上课 · ${current.name}`);
  else if (next) pages.unshift(`下一节 ${next.start} · ${next.name}`);
  if (left > 0) pages.push(`待办剩 ${left} 项`);

  useEffect(() => {
    if (pages.length <= 1) return;
    const id = window.setInterval(() => setTick((s) => s + 1), 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, current?.id, next?.id, left]);

  const override = focusOn
    ? `专注中${activeCourse ? ` · ${activeCourse.name}` : ""}`
    : activeCourse
      ? `上课中 · ${activeCourse.name}`
      : null;
  const sub = override ?? pages[tick % pages.length];

  return (
    <div
      className="glass no-drag rounded-full pl-3 pr-4 py-2 flex items-center gap-2.5 animate-fade-in cursor-pointer select-none"
      style={{ fontVariantNumeric: "tabular-nums" }}
      title={sub}
    >
      <span className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
        <UiIcon k="logo" size={13} />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
        {hh}:{mm}
      </span>
      <span key={sub} className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 max-w-[110px] truncate animate-fade-in">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${focusOn ? "bg-violet-500 animate-pulse" : activeCourse ? "bg-emerald-500 animate-pulse" : current ? "bg-emerald-500 animate-pulse" : "bg-sky-500"}`} />
        <span className="truncate">{sub}</span>
      </span>
    </div>
  );
}
