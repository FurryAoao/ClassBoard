import { useMemo, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { fmtDate } from "../lib/utils";

/** 日历：月视图 + 当日日程 */
export default function CalendarCard() {
  const now = useNow(true);
  const [offset, setOffset] = useState(0);
  const [events, setEvents] = usePersistentState<Record<string, string[]>>("calendar:events", {});
  const [draft, setDraft] = useState("");

  const base = useMemo(() => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return d;
  }, [now, offset]);
  const cells = useMemo(() => {
    const y = base.getFullYear(), m = base.getMonth();
    const first = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const arr: (number | null)[] = [...Array(first).fill(null)];
    for (let d = 1; d <= days; d++) arr.push(d);
    return { y, m, arr };
  }, [base]);
  const todayStr = fmtDate(now);
  const selKey = fmtDate(new Date(cells.y, cells.m, Math.min(now.getDate(), new Date(cells.y, cells.m + 1, 0).getDate())));
  const [sel, setSel] = useState<string | null>(null);
  const key = sel ?? todayStr;

  return (
    <div className="space-y-2">
      <div className="flex items-center text-[12px] font-bold">
        <button onClick={() => setOffset(offset - 1)} className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">‹</button>
        <span className="flex-1 text-center">{cells.y} 年 {cells.m + 1} 月</span>
        <button onClick={() => setOffset(offset + 1)} className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">›</button>
        <button onClick={() => { setOffset(0); setSel(null); }} className="ml-1 text-[10px] px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">今天</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-400">
        {["一", "二", "三", "四", "五", "六", "日"].map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.arr.map((d, i) => {
          if (d === null) return <span key={i} />;
          const k = fmtDate(new Date(cells.y, cells.m, d));
          const isToday = k === todayStr;
          const has = (events[k]?.length ?? 0) > 0;
          return (
            <button key={i} onClick={() => setSel(k)}
              className={`aspect-square text-[11px] rounded-full relative ${k === key ? "bg-neutral-900 text-white dark:bg-white dark:text-black font-bold" : isToday ? "bg-sky-500/20 font-bold" : "hover:bg-black/5 dark:hover:bg-white/10"}`}>
              {d}{has && <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] font-bold px-1">{key} 的日程</div>
      <div className="space-y-1">
        {(events[key] ?? []).map((e, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-xl bg-white/50 dark:bg-white/5">
            <span className="flex-1">{e}</span>
            <button className="text-neutral-400 hover:text-red-500" onClick={() => setEvents({ ...events, [key]: events[key].filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="添加日程…" className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none" />
        <button className="text-[12px] px-3 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold"
          onClick={() => { if (!draft.trim()) return; setEvents({ ...events, [key]: [...(events[key] ?? []), draft.trim()] }); setDraft(""); }}>＋</button>
      </div>
    </div>
  );
}
