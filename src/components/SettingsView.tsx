import { useState } from "react";
import { useSettings } from "../store/useSettings";
import { FEATURE_META, FEATURE_ORDER } from "../lib/utils";

export default function SettingsView() {
  const { enabled, toggleFeature, exportAll, importAll } = useSettings();
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="space-y-2">
      <div className="text-[13px] font-bold px-1">⚙️ 功能开关 <span className="font-normal text-neutral-400 text-[11px]">· 关闭后隐藏入口/停止任务/保留数据</span></div>
      <div className="space-y-1.5">
        {FEATURE_ORDER.map((k) => (
          <label key={k} className="flex items-center gap-2.5 px-2.5 py-2 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 cursor-pointer hover:scale-[1.01] transition-transform">
            <span className="text-lg w-7 text-center">{FEATURE_META[k].icon}</span>
            <span className="flex-1">
              <span className="block text-[12px] font-bold">{FEATURE_META[k].name}
                {k === "clock" && <span className="ml-1 text-[10px] font-normal text-emerald-600">默认开</span>}
              </span>
              <span className="block text-[10px] text-neutral-500">{FEATURE_META[k].desc}</span>
            </span>
            <button
              onClick={(e) => { e.preventDefault(); toggleFeature(k); }}
              className={`w-10 h-6 rounded-full relative transition-colors ${enabled[k] ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"}`}
              title={enabled[k] ? "点击关闭" : "点击开启"}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${enabled[k] ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </label>
        ))}
      </div>

      <div className="text-[13px] font-bold px-1 pt-2">💾 本地数据 · 导出 / 导入</div>
      <div className="flex gap-2">
        <button className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold"
          onClick={async () => { const j = await exportAll(); setJson(j); setMsg("已导出到下方文本框，复制保存即可。"); }}>
          导出全部数据
        </button>
        <button className="flex-1 text-[12px] px-3 py-2 rounded-xl bg-black/5 dark:bg-white/10 font-bold"
          onClick={async () => {
            try { await importAll(json); } catch { setMsg("导入失败：JSON 格式不正确"); }
          }}>
          从下方导入
        </button>
      </div>
      <textarea value={json} onChange={(e) => setJson(e.target.value)} placeholder="导出 JSON 会显示在这里；粘贴备份 JSON 后点导入"
        className="w-full h-20 text-[10px] p-2 rounded-xl bg-black/5 dark:bg-black/30 outline-none resize-none font-mono" />
      {msg && <div className="text-[11px] text-emerald-600 px-1">{msg}</div>}
      <div className="text-[10px] text-neutral-400 px-1 pb-2">本地优先 · SQLite + localStorage 双存 · 不登录不联网也能用</div>
    </div>
  );
}
