import { usePersistentState } from "../lib/store-helpers";
import CardHeader from "../components/CardHeader";

const CONDITIONS = ["晴", "多云", "阴", "雨", "雪", "雾"];

/** 天气 / 小部件：手动记录 + 备忘（不强制联网） */
export default function WeatherCard() {
  const [cond, setCond] = usePersistentState("weather:cond", "晴");
  const [temp, setTemp] = usePersistentState("weather:temp", "22°");
  const [memo, setMemo] = usePersistentState("weather:memo", "");
  return (
    <div className="space-y-2">
      <CardHeader icon="weather" title="天气" sub={`${cond}${temp ? ` · ${temp}` : ""}`} />
      <div className="text-center py-4 rounded-3xl bg-gradient-to-br from-sky-400/25 via-sky-300/15 to-amber-300/25 dark:from-sky-500/15 dark:to-amber-400/10 border border-black/5 dark:border-white/10">
        <div className="text-[26px] font-black tracking-tight text-neutral-900 dark:text-white">{cond} · {temp || "--"}</div>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5 px-3">
          {CONDITIONS.map((c) => (
            <button key={c} onClick={() => setCond(c)}
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${cond === c ? "bg-sky-500 text-white shadow-sm" : "bg-white/70 dark:bg-white/10 text-neutral-500"}`}>{c}</button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="text-[11px] text-neutral-500">温度</span>
          <input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="22°" className="w-16 text-[12px] px-2 py-1 rounded-full bg-white/70 dark:bg-black/30 outline-none text-center font-bold" />
        </div>
        <div className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">课前看一眼，手动记录即可（不强制联网）</div>
      </div>
      <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="小部件备忘：如下节带教具（自动保存）" rows={3}
        className="cb-input resize-none !py-2.5" />
    </div>
  );
}
