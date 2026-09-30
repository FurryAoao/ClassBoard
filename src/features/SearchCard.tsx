import { useMemo, useState } from "react";
import { useSettings } from "../store/useSettings";
import { FEATURE_META } from "../lib/utils";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

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
    for (const [k, m] of Object.entries(FEATURE_META)) {
      if (m.name.includes(q) || k.includes(q.toLowerCase())) out.push({ feature: k, label: "功能：" + m.name, hit: m.desc });
    }
    return out.slice(0, 20);
  }, [q]);

  return (
    <div className="space-y-2">
      <CardHeader icon="search" title="全局搜索" sub="本机数据" />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><UiIcon k="search" size={14} /></span>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜功能 / 待办 / 课程 / 备注"
          className="cb-input !pl-9 !py-2.5 !rounded-2xl" />
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {q.trim() && results.length === 0 && <div className="cb-empty">没有匹配结果</div>}
        {!q.trim() && <div className="cb-empty">输入关键词，搜索本机全部教学数据</div>}
        {results.map((r, i) => (
          <button key={i} className="w-full text-left px-3 py-2 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] hover:border-sky-500/40 transition-colors"
            onClick={() => {
              const fk = (Object.keys(FEATURE_META) as string[]).includes(r.feature) ? r.feature as any : null;
              if (fk) openFeature(fk);
            }}>
            <span className="font-bold text-neutral-800 dark:text-neutral-100">{r.label}</span>
            <span className="block text-neutral-500 truncate">{r.hit}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
