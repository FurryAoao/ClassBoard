import { useState } from "react";
import { usePersistentState } from "../lib/store-helpers";
import { UiIcon } from "../components/icons";
import CardHeader from "../components/CardHeader";

/** 剪贴板历史：手动收藏模式（轻量，不常驻监听） */
export default function ClipboardCard() {
  const [items, setItems] = usePersistentState<string[]>("clipboard:list", []);
  const [top, setTop] = usePersistentState("clipboard:top", "");
  const [msg, setMsg] = useState("");
  const paste = async () => {
    setMsg("");
    try {
      const t = await navigator.clipboard.readText();
      if (!t) { setMsg("剪贴板是空的"); return; }
      if (items.includes(t)) { setMsg("这条已经收藏过了"); return; }
      setItems([t, ...items].slice(0, 30));
      setMsg("已收藏");
    } catch { setMsg("读不到剪贴板：浏览器里要点地址栏允许权限，桌面端直接可用"); }
  };
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setMsg("已复制回剪贴板"); }
    catch { setMsg("复制失败：请手动长按复制"); }
  };
  return (
    <div className="space-y-2">
      <CardHeader icon="clipboard" title="剪贴板历史" sub="最多 30 条" />
      <button onClick={paste} className="cb-btn-primary w-full !py-2.5 flex items-center justify-center gap-1.5"><UiIcon k="plus" size={13} />收藏当前剪贴板</button>
      {msg && <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 px-1 animate-fade-in">{msg}</div>}
      {top && (
        <div className="px-2.5 py-2 rounded-2xl bg-sky-500/[0.08] border border-sky-500/30 text-[11px]">
          <div className="text-[10px] font-black text-sky-600 dark:text-sky-400 mb-0.5">钉在板书 · 一键复制</div>
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate font-bold text-neutral-800 dark:text-neutral-100">{top}</span>
            <button className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0" onClick={() => copy(top)}>复制</button>
            <button className="cb-icon-btn !w-5 !h-5" title="取消钉板" onClick={() => setTop("")}><UiIcon k="x" size={10} /></button>
          </div>
        </div>
      )}
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {items.map((t, i) => (
          <div key={i} className="cb-row !py-2 text-[11px]">
            <span className="flex-1 truncate text-neutral-700 dark:text-neutral-200">{t}</span>
            {t !== top && <button className="text-[11px] text-neutral-400 hover:text-sky-500 font-bold shrink-0" title="钉在上方，一键复制" onClick={() => { setTop(t); setMsg("已钉在板书"); }}>钉</button>}
            <button className="text-[11px] text-sky-600 dark:text-sky-400 font-bold hover:underline shrink-0" onClick={() => copy(t)}>复制</button>
            <button className="cb-icon-btn !w-5 !h-5" onClick={() => setItems(items.filter((_, j) => j !== i))}><UiIcon k="x" size={10} /></button>
          </div>
        ))}
        {items.length === 0 && <div className="cb-empty">点上方按钮把常用板书 / 链接收进来</div>}
      </div>
    </div>
  );
}
