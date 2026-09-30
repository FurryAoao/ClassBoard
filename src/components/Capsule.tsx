import { useNow } from "../lib/store-helpers";

/** 收起态：右下角小胶囊，只显示时间（外壳，不占功能位） */
export default function Capsule() {
  const now = useNow(true);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <div className="glass no-drag rounded-full px-4 py-2 flex items-center gap-2 animate-fade-in cursor-pointer select-none"
      style={{ fontVariantNumeric: "tabular-nums" }}>
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
        {hh}:{mm}
      </span>
      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">ClassBoard · 悬停展开</span>
    </div>
  );
}
