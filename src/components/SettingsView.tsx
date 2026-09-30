import { useState } from "react";
import { useSettings } from "../store/useSettings";
import { FEATURE_META, FEATURE_ORDER } from "../lib/utils";
import { FeatureIcon, UiIcon } from "./icons";
import { FEATURE_TINT } from "./CardHeader";

export default function SettingsView() {
  const { enabled, toggleFeature, exportAll, importAll } = useSettings();
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");
  const onCount = FEATURE_ORDER.filter((k) => enabled[k]).length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-0.5">
        <span className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center"><UiIcon k="sliders" size={14} /></span>
        <span className="text-[13px] font-bold tracking-tight">功能开关</span>
        <span className="cb-chip bg-emerald-500/15 text-emerald-600 !text-[10px]">{onCount} / {FEATURE_ORDER.length} 开启</span>
      </div>
      <div className="text-[10px] text-neutral-400 px-0.5 -mt-1">关闭后隐藏入口 / 停止任务 / 保留数据</div>
      <div className="space-y-1.5">
        {FEATURE_ORDER.map((k) => (
          <label key={k} className="flex items-center gap-2.5 pl-2 pr-2.5 py-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] cursor-pointer hover:border-black/10 dark:hover:border-white/15 transition-colors">
            <span className={`w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 ${FEATURE_TINT[k]}`}><FeatureIcon k={k} size={15} /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-bold text-neutral-800 dark:text-neutral-100">{FEATURE_META[k].name}
                {k === "clock" && <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">默认开</span>}
              </span>
              <span className="block text-[10px] text-neutral-400 truncate">{FEATURE_META[k].desc}</span>
            </span>
            <button
              onClick={(e) => { e.preventDefault(); toggleFeature(k); }}
              className={`w-10 h-[22px] rounded-full relative transition-colors shrink-0 ${enabled[k] ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`}
              title={enabled[k] ? "点击关闭" : "点击开启"}
            >
              <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${enabled[k] ? "left-[20px]" : "left-[2px]"}`} />
            </button>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 px-0.5 pt-1">
        <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center"><UiIcon k="database" size={14} /></span>
        <span className="text-[13px] font-bold tracking-tight">本地数据 · 导出 / 导入</span>
      </div>
      <div className="flex gap-1.5">
        <button className="cb-btn-primary flex-1"
          onClick={async () => { const j = await exportAll(); setJson(j); setMsg("已导出到下方文本框，复制保存即可。"); }}>
          导出全部数据
        </button>
        <button className="cb-btn-ghost flex-1"
          onClick={async () => {
            try { await importAll(json); } catch { setMsg("导入失败：JSON 格式不正确"); }
          }}>
          从下方导入
        </button>
      </div>
      <textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder="导出 JSON 会显示在这里；粘贴备份 JSON 后点导入"
        className="cb-input !h-20 !text-[10px] font-mono resize-none" />
      {msg && <div className="text-[11px] font-bold text-emerald-600 px-1">{msg}</div>}
      <div className="text-[10px] text-neutral-400 px-1 pb-2 text-center">本地优先 · SQLite + localStorage 双存 · 不登录不联网也能用</div>
    </div>
  );
}
