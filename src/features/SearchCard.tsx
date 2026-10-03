import { useMemo, useState } from "react";
import { useSettings } from "../store/useSettings";
import { FEATURE_META, type FeatureKey } from "../lib/utils";
import { UiIcon, FeatureIcon } from "../components/icons";
import { FEATURE_TINT } from "../components/CardHeader";
import CardHeader from "../components/CardHeader";

interface Hit { feature: FeatureKey | null; label: string; hit: string; go: FeatureKey; }

function pretty(v: string): string {
  try {
    const o = JSON.parse(v);
    if (Array.isArray(o)) {
      const strs = o.slice(0, 8).map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object") return (x as any).text ?? (x as any).name ?? (x as any).title ?? JSON.stringify(x).slice(0, 30);
        return String(x);
      });
      return strs.join(" / ").slice(0, 80);
    }
    if (o && typeof o === "object") return JSON.stringify(o).slice(0, 80);
    return String(o).slice(0, 80);
  } catch { return v.slice(0, 80); }
}

const KEY2FEATURE: Array<[RegExp, FeatureKey]> = [
  [/todos/, "todos"], [/schedule/, "schedule"], [/calendar/, "calendar"],
  [/picker/, "picker"], [/shortcuts/, "shortcuts"], [/board/, "board"],
  [/clipboard/, "clipboard"], [/weather/, "weather"], [/timer/, "timer"],
  [/focus/, "focus"], [/display/, "display"], [/plugins/, "plugins"],
];

/** 全局搜索：跨已开启功能 + 本地数据，点击直达对应功能 */
export default function SearchCard() {
  const [q, setQ] = useState("");
  const { openFeature } = useSettings();
  const results = useMemo<Hit[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const out: Hit[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (!k.startsWith("cb:")) continue;
        if (k === "cb:enabled" || k === "cb:ui") continue;
        if (k === "cb:board:img") continue; // 白板位图不进搜索
        if (k === "cb:lesson" || k === "cb:pos" || k === "cb:timer") continue; // 内部状态不进搜索
        if (k === "cb:focus" || k.startsWith("cb:focus:")) continue; // 专注内部状态不进搜索
        if (k === "cb:display" || k === "cb:display:mode") continue; // 投屏内部状态不进搜索
        if (k === "cb:app" || k === "cb:version" || k === "cb:exportedAt") continue; // 备份元信息不进搜索 // 白板位图不进搜索
        if (k === "cb:sound" || k.startsWith("cb:sound:")) continue; // 提醒开关不进搜索
        if (k === "cb:bell" || k.startsWith("cb:bell:")) continue; // 铃声已响标记/开关不进搜索
        if (k === "cb:picker:check:date") continue; // 考勤日期标记不进搜索
        const v = localStorage.getItem(k) ?? "";
        if (v.length > 4000) continue; // 超大值（二进制/位图）跳过
        if (v.toLowerCase().includes(query)) {
          const short = k.replace("cb:", "");
          const go = KEY2FEATURE.find(([re]) => re.test(short))?.[1] ?? "search";
          out.push({ feature: null, label: short, hit: pretty(v), go });
        }
      }
    } catch { /* ignore */ }
    for (const [k, m] of Object.entries(FEATURE_META)) {
      if (m.name.includes(q) || k.includes(query) || m.desc.includes(q)) {
        out.push({ feature: k as FeatureKey, label: "功能：" + m.name, hit: m.desc, go: k as FeatureKey });
      }
    }
    return out.slice(0, 20);
  }, [q]);

  return (
    <div className="space-y-2">
      <CardHeader icon="search" title="全局搜索" sub="本机数据 · 点结果直达" />
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><UiIcon k="search" size={14} /></span>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜功能 / 待办 / 课程 / 备注"
          className="cb-input !pl-9 !py-2.5 !rounded-2xl" />
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {q.trim() && results.length === 0 && <div className="cb-empty">没有匹配结果</div>}
        {!q.trim() && <div className="cb-empty">输入关键词，搜索本机全部教学数据</div>}
        {results.map((r, i) => (
          <button key={i} className="w-full flex items-center gap-2 text-left px-2.5 py-2 rounded-xl bg-white/60 dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] hover:border-sky-500/40 transition-colors"
            onClick={() => openFeature(r.go)}>
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${FEATURE_TINT[r.go]}`}>
              <FeatureIcon k={r.go} size={13} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-neutral-800 dark:text-neutral-100 truncate">{r.label}</span>
              <span className="block text-neutral-500 truncate">{r.hit}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
