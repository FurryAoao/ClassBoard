import { usePersistentState } from "../lib/store-helpers";
import CardHeader from "../components/CardHeader";
import { FeatureIcon } from "../components/icons";

/** 天气 / 小部件：手动记录 + 备忘（不强制联网） */
export default function WeatherCard() {
  const [info, setInfo] = usePersistentState("weather:info", "晴 · 22°");
  const [memo, setMemo] = usePersistentState("weather:memo", "");
  return (
    <div className="space-y-2">
      <CardHeader icon="weather" title="天气" sub="手动记录" />
      <div className="text-center py-5 rounded-3xl bg-gradient-to-br from-sky-400/25 via-sky-300/15 to-amber-300/25 dark:from-sky-500/15 dark:to-amber-400/10 border border-black/5 dark:border-white/10">
        <div className="text-sky-500 dark:text-sky-300 flex justify-center"><FeatureIcon k="weather" size={30} /></div>
        <input value={info} onChange={(e) => setInfo(e.target.value)} className="mt-1.5 w-full bg-transparent text-center text-[17px] font-black tracking-tight outline-none text-neutral-900 dark:text-white" />
        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">课前看一眼，手动记录即可（不强制联网）</div>
      </div>
      <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="小部件备忘：如下节带教具（自动保存）" rows={3}
        className="cb-input resize-none !py-2.5" />
    </div>
  );
}
