import { usePersistentState } from "../lib/store-helpers";

/** 剪贴板历史：手动收藏模式（轻量，不常驻监听） */
export default function ClipboardCard() {
  const [items, setItems] = usePersistentState<string[]>("clipboard:list", []);
  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      if (t && !items.includes(t)) setItems([t, ...items].slice(0, 30));
    } catch { alert("浏览器预览限制：请允许剪贴板读取，或在桌面端使用"); }
  };
  return (
    <div className="space-y-2">
      <div className="text-[12px] font-bold">📋 剪贴板历史 <span className="font-normal text-neutral-400">· 最多 30 条</span></div>
      <button onClick={paste} className="w-full text-[12px] py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-bold">＋ 收藏当前剪贴板</button>
      <div className="space-y-1 max-h-56 overflow-y-auto">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/50 dark:bg-white/5 text-[11px]">
            <span className="flex-1 truncate">{t}</span>
            <button className="text-sky-600 font-bold" onClick={() => navigator.clipboard?.writeText(t).catch(() => {})}>复制</button>
            <button className="text-neutral-400 hover:text-red-500" onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-center text-[11px] text-neutral-400 py-4">点上方按钮把常用板书/链接收进来</div>}
      </div>
    </div>
  );
}
