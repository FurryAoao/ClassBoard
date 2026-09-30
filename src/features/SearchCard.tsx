import { useMemo, useState } from "react";
import { useSettings } from "../store/useSettings";
import { FEATURE_META } from "../lib/utils";

/** 全局搜索：跨已开启功能 + 本地数据 */
export default function SearchCard() {
  const [q, setQ] = useState("");
  const { openFeature } = useSettings();
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const out: { feature: string; label: string; hit: string }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (!k.startsWith("cb:")) continue;
        const v = localStorage.getItem(k) ?? "";
        if (v.toLowerCase().includes(q.toLowerCase())) {
          out.push({ feature: k, label: k.replace("cb:", ""), hit: v.slice(0, 60) });
        }
      }
    } catch { /* ignore */ }
    // 功能名匹配
    for (const [k, m] of Object.entries(FEATURE_META)) {
      if (m.name.includes(q) || k.includes(q.toLowerCase())) out.push({ feature: k, label: "功能：" + m.name, hit: m.desc });
    }
    return out.slice(0, 20);
  }, [q]);

  return (
    <div className="space-y-2">
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 搜功能 / 待办 / 课程 / 备注…"
        className="w-full text-[13px] px-3.5 py-2.5 rounded-2xl bg-black/5 dark:bg-black/30 outline-none" />
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {q.trim() && results.length === 0 && <div className="text-center text-[11px] text-neutral-400 py-6">没有匹配结果</div>}
        {!q.trim() && <div className="text-center text-[11px] text-neutral-400 py-6">输入关键词，搜索本机全部教学数据</div>}
        {results.map((r, i) => (
          <button key={i} className="w-full text-left px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 text-[11px]"
            onClick={() => {
              const fk = (Object.keys(FEATURE_META) as string[]).includes(r.feature) ? r.feature as any : null;
              if (fk) openFeature(fk);
            }}>
            <span className="font-bold">{r.label}</span>
            <span className="block text-neutral-500 truncate">{r.hit}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
