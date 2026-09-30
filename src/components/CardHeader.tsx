import type { ReactNode } from "react";
import type { FeatureKey } from "../lib/utils";
import { FeatureIcon } from "./icons";

/** 每个功能的柔和底色：浅底 + 彩色线性图标，替代 emoji 标题 */
export const FEATURE_TINT: Record<FeatureKey, string> = {
  clock: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  board: "bg-rose-500/10 text-rose-500 dark:text-rose-400",
  shortcuts: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  schedule: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  calendar: "bg-orange-500/10 text-orange-500 dark:text-orange-400",
  timer: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  picker: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  todos: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  search: "bg-slate-500/10 text-slate-500 dark:text-slate-300",
  focus: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  capture: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  clipboard: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  weather: "bg-sky-500/10 text-sky-500 dark:text-sky-300",
  display: "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400",
  plugins: "bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-400",
};

/** 统一卡片标题：图标徽章 + 标题 + 副标题 + 右侧操作 */
export default function CardHeader({
  icon, title, sub, right,
}: { icon: FeatureKey; title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${FEATURE_TINT[icon]}`}>
        <FeatureIcon k={icon} size={14} />
      </span>
      <span className="text-[13px] font-bold tracking-tight text-neutral-800 dark:text-neutral-100">{title}</span>
      {sub && <span className="text-[11px] font-normal text-neutral-400 truncate">{sub}</span>}
      {right && <div className="ml-auto flex items-center gap-1.5 shrink-0">{right}</div>}
    </div>
  );
}
