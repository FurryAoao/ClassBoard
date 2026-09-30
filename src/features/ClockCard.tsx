import { useNow } from "../lib/store-helpers";
import { fmtDate, weekZh } from "../lib/utils";
import CardHeader from "../components/CardHeader";

/** 时钟（默认开）：时间 / 日期 / 星期 */
export default function ClockCard() {
  const now = useNow(true);
  return (
    <div className="space-y-2">
      <CardHeader icon="clock" title="时钟" sub="默认开启 · 不打扰" />
      <div className="text-center py-5 rounded-3xl bg-gradient-to-b from-white/80 to-white/40 dark:from-white/[0.07] dark:to-white/[0.02] border border-black/5 dark:border-white/10 shadow-sm">
        <div className="text-[52px] leading-none font-black tracking-tight text-neutral-900 dark:text-white" style={{ fontVariantNumeric: "tabular-nums" }}>
          {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
          <span className="text-xl font-bold text-neutral-400 ml-1">:{String(now.getSeconds()).padStart(2, "0")}</span>
        </div>
        <div className="mt-2 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">{fmtDate(now)} · {weekZh(now.getDay())}</div>
      </div>
    </div>
  );
}
