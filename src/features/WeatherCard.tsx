import { usePersistentState } from "../lib/store-helpers";

/** 天气 / 小部件：手动记录 + 备忘（不强制联网） */
export default function WeatherCard() {
  const [info, setInfo] = usePersistentState("weather:info", "晴 · 22°");
  const [memo, setMemo] = usePersistentState("weather:memo", "");
  return (
    <div className="space-y-2">
      <div className="text-center py-4 rounded-2xl bg-gradient-to-br from-sky-400/30 to-amber-300/30 border border-black/5 dark:border-white/10">
        <div className="text-3xl">🌤️</div>
        <input value={info} onChange={(e) => setInfo(e.target.value)} className="mt-1 w-full bg-transparent text-center text-[16px] font-black outline-none" />
        <div className="text-[10px] text-neutral-500">课前看一眼，手动记录即可（不强制联网）</div>
      </div>
      <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="小部件备忘：如下节带教具…（自动保存）" rows={3}
        className="w-full text-[12px] p-2.5 rounded-xl bg-black/5 dark:bg-black/30 outline-none resize-none" />
    </div>
  );
}
