import { useNow } from "../lib/store-helpers";
import { fmtDate, weekZh } from "../lib/utils";

/** 时钟（默认开）：时间 / 日期 / 星期 */
export default function ClockCard() {
  const now = useNow(true);
  return (
    <div className="text-center py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10">
      <div className="text-5xl font-black tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
        {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
        <span className="text-xl font-bold text-neutral-400">:{String(now.getSeconds()).padStart(2, "0")}</span>
      </div>
      <div className="mt-1 text-[13px] text-neutral-500">{fmtDate(now)} · {weekZh(now.getDay())}</div>
      <div className="mt-3 flex justify-center gap-2 text-[11px]">
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600">默认开启 · 不打扰</span>
      </div>
    </div>
  );
}
