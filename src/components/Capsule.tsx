import { useNow } from "../lib/store-helpers";
import { UiIcon } from "./icons";

/** 收起态：右下角小胶囊，只显示时间（外壳，不占功能位） */
export default function Capsule() {
  const now = useNow(true);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <div
      className="glass no-drag rounded-full pl-3 pr-4 py-2 flex items-center gap-2.5 animate-fade-in cursor-pointer select-none"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span className="w-6 h-6 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
        <UiIcon k="logo" size={13} />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
        {hh}:{mm}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        悬停展开
      </span>
    </div>
  );
}
