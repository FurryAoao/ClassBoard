import { useMemo } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { useSettings } from "../store/useSettings";
import { fmtDate, weekZh } from "../lib/utils";
import CardHeader from "../components/CardHeader";

interface Course { id: string; day: number; start: string; end: string; name: string; room: string; }

/** 时钟（默认开）：时间 / 日期 / 下一节倒计时 */
export default function ClockCard() {
  const now = useNow(true);
  const { enabled } = useSettings();
  const [courses] = usePersistentState<Course[]>("schedule:list", []);
  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const d = (now.getDay() + 6) % 7;
  const { current, next, toNext } = useMemo(() => {
    if (!enabled.schedule) return { current: null as Course | null, next: null as Course | null, toNext: "" };
    const list = courses.filter((c) => c.day === d).sort((a, b) => a.start.localeCompare(b.start));
    const cur = list.find((c) => c.start <= t && t <= c.end) ?? null;
    const nx = list.find((c) => c.start > t) ?? null;
    let diff = "";
    if (nx) {
      const [h, m] = nx.start.split(":").map(Number);
      const mins = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
      diff = mins >= 60 ? `${Math.floor(mins / 60)}小时${mins % 60}分后` : `${mins}分钟后`;
    }
    return { current: cur, next: nx, toNext: diff };
  }, [courses, d, t, enabled.schedule, now]);
  return (
    <div className="space-y-2">
      <CardHeader icon="clock" title="时钟" sub="默认开启 · 不打扰" />
      <div className="text-center py-5 rounded-3xl bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border border-black/5 dark:border-white/10 shadow-sm">
        <div className="text-[52px] leading-none font-black tracking-tight text-neutral-900 dark:text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
          <span className="text-xl font-bold text-neutral-400 ml-1">:{String(now.getSeconds()).padStart(2, "0")}</span>
        </div>
        <div className="mt-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{fmtDate(now)} · {weekZh(now.getDay())}</div>
        {enabled.schedule && (current || next) && (
          <div className={`mt-2 mx-4 text-[11px] font-bold px-2.5 py-1.5 rounded-full ${current ? "bg-emerald-500 text-white" : "bg-sky-500/15 text-sky-700 dark:text-sky-300"}`}>
            {current ? `正在上课：${current.name} · ${current.end}下课` : `${toNext}：${next!.name} · ${next!.start}${next!.room ? ` · ${next!.room}` : ""}`}
          </div>
        )}
      </div>
    </div>
  );
}
