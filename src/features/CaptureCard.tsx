import { useState } from "react";
import { useSettings } from "../store/useSettings";
import CardHeader from "../components/CardHeader";
import { FeatureIcon } from "../components/icons";

/** 截图 / 录屏：各平台原生能力入口（轻量，不内置重型引擎） */
const TIPS: Record<string, string[]> = {
  shot: ["Windows：Win + Shift + S", "macOS：Cmd + Shift + 4", "Linux：Shift + Print / Spectacle"],
  rec: ["Windows：Win + G（Xbox Game Bar）", "macOS：Cmd + Shift + 5", "Linux：OBS / Peek"],
};

export default function CaptureCard() {
  const [open, setOpen] = useState<"shot" | "rec" | null>(null);
  const { openFeature } = useSettings();
  const card = (k: "shot" | "rec", title: string, sub: string, accent: string, icon: "capture" | "display") => (
    <div className="rounded-3xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.07] overflow-hidden">
      <button onClick={() => setOpen(open === k ? null : k)}
        className="w-full py-4 transition-all active:scale-[0.99] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
        <span className={`flex justify-center ${accent}`}><FeatureIcon k={icon} size={20} /></span>
        <span className="block mt-1.5 text-[12px] font-bold text-neutral-800 dark:text-neutral-100">{title}</span>
        <span className="block text-[10px] font-normal text-neutral-400">{sub}</span>
      </button>
      {open === k && (
        <div className="px-3 pb-3 space-y-1 animate-slide-up">
          {TIPS[k].map((t) => (
            <div key={t} className="text-[11px] px-2.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300 font-medium">{t}</div>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <div className="space-y-2">
      <CardHeader icon="capture" title="截图 / 录屏" sub="调用系统能力" />
      <div className="grid grid-cols-2 gap-2">
        {card("shot", "系统截图", "点开展开各平台按键", "text-sky-500", "capture")}
        {card("rec", "系统录屏", "点开展开各平台工具", "text-rose-500", "display")}
      </div>
      <button onClick={() => openFeature("shortcuts")}
        className="w-full px-3 py-2 rounded-2xl bg-sky-500/[0.08] border border-sky-500/25 text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-500/[0.14] transition-colors">
        存好的课件目录，去「快捷方式」快速打开
      </button>
      <div className="text-[10px] text-neutral-400 leading-relaxed px-1">
        轻量原则：不内置重型录屏引擎，直接用各平台原生能力。
      </div>
    </div>
  );
}
