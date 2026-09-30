import { useMemo, useState } from "react";
import { usePersistentState, useNow } from "../lib/store-helpers";
import { fmtDate } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

/** 日历：月视图 + 当日日程 + 本月 agenda */
export default function CalendarCard() {
  const now = useNow(true);
  const [offset, setOffset] = useState(0);
  const [events, setEvents] = usePersistentState<Record<string, string[]>>("calendar:events", {});
  const [draft, setDraft] = useState("");
  const [showAgenda, setShowAgenda] = useState(false);

  const base = useMemo(() => new Date(now.getFullYear(), now.getMonth() + offset, 1), [now, offset]);
  const cells = useMemo(() => {
    const y = base.getFullYear(), m = base.getMonth();
    const first = (new Date(y, m, 1).getDay() + 6) % 7;
    const days = new Date(y, m + 1, 0).getDate();
    const arr: (number | null)[] = [...Array(first).fill(null)];
    for (let d = 1; d <= days; d++) arr.push(d);
    return { y, m, arr };
  }, [base]);
  const todayStr = fmtDate(now);
  const [sel, setSel] = useState<string | null>(null);
  const key = sel ?? todayStr;
  const add = () => { if (!draft.trim()) return; setEvents({ ...events, [key]: [...(events[key] ?? []), draft.trim()] }); setDraft(""); };

  const monthKeys = useMemo(() => {
    const prefix = `${cells.y}-${String(cells.m + 1).padStart(2, "0")}`;
    return Object.entries(events)
      .filter(([k, v]) => k.startsWith(prefix) && v.length)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [events, cells.y, cells.m]);
  const monthCount = monthKeys.reduce((n, [, v]) => n + v.length, 0);

  return (
    <div className="space-y-2">
      <CardHeader icon="calendar" title="日历" sub={`${cells.y} 年 ${cells.m + 1} 月${monthCount ? ` · ${monthCount} 项日程` : ""}`}
        right={
          monthCount > 0 ? (
            <button onClick={() => setShowAgenda(!showAgenda)} className="cb-chip !text-[10px] bg-black/[0.05] dark:bg-white/10 text-neutral-500 hover:bg-black/[0.09] transition-colors">
              {showAgenda ? "收起 agenda" : "本月 agenda"}
            </button>
          ) : undefined
        } />
      <div className="flex items-center gap-1.5">
        <button onClick={() => setOffset(offset - 1)} className="w-7 h-7 rounded-full bg-black/[0.04] dark:bg-white/[0.07] flex items-center justify-center text-neutral-500 hover:bg-black/[0.08] transition-colors"><UiIcon k="chevL" size={13} /></button>
        <button onClick={() => { setOffset(0); setSel(null); }} className="flex-1 text-[11px] py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.07] font-bold text-neutral-600 dark:text-neutral-200">回到今天</button>
        <button onClick={() => setOffset(offset + 1)} className="w-7 h-7 rounded-full bg-black/[0.04] dark:bg-white/[0.07] flex items-center justify-center text-neutral-500 hover:bg-black/[0.08] transition-colors"><UiIcon k="chevR" size={13} /></button>
      </div>
      <div className="cb-panel-card !px-2.5">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-neutral-400">
          {["一", "二", "三", "四", "五", "六", "日"].map((wd) => <span key={wd}>{wd}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.arr.map((d, i) => {
            if (d === null) return <span key={i} />;
            const k = fmtDate(new Date(cells.y, cells.m, d));
            const isToday = k === todayStr;
            const has = (events[k]?.length ?? 0) > 0;
            return (
              <button key={i} onClick={() => setSel(k)}
                className={`aspect-square text-[11px] rounded-full relative transition-all ${k === key ? "bg-neutral-900 text-white dark:bg-white dark:text-black font-bold shadow" : isToday ? "bg-sky-500/20 font-bold text-sky-700 dark:text-sky-300" : "hover:bg-black/[0.05] dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300"}`}>
                {d}{has && <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />}
              </button>
            );
          })}
        </div>
      </div>
      {showAgenda && monthKeys.length > 0 && (
        <div className="cb-panel-card !py-2 space-y-1 max-h-28 overflow-y-auto animate-slide-up">
          {monthKeys.map(([k, v]) => (
            <button key={k} onClick={() => { setSel(k); setShowAgenda(false); }} className="w-full flex gap-2 text-left text-[11px]">
              <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>{k.slice(5)}</span>
              <span className="flex-1 truncate text-neutral-600 dark:text-neutral-300">{v.join(" / ")}</span>
            </button>
          ))}
        </div>
      )}
      <div className="text-[11px] font-bold px-1 text-neutral-500">{key} 的日程</div>
      <div className="space-y-1">
        {(events[key] ?? []).map((e, i) => (
          <div key={i} className="cb-row !py-1.5 text-[11px]">
            <span className="flex-1 text-neutral-800 dark:text-neutral-100">{e}</span>
            <button className="cb-icon-btn !w-5 !h-5" onClick={() => setEvents({ ...events, [key]: events[key].filter((_, j) => j !== i) })}><UiIcon k="x" size={10} /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="添加日程" className="cb-input" />
        <button className="cb-btn-primary !px-3.5 flex items-center" onClick={add}><UiIcon k="plus" size={13} /></button>
      </div>
    </div>
  );
}
